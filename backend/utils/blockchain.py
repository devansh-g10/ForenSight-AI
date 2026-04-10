"""
ForenSight AI - Blockchain Certificate Hashing (Phase 7)
=========================================================
Implements SHA-256 based document hashing with a simple
append-only ledger for certificate verification.

Features:
  - SHA-256 hash of document bytes (tamper-evident fingerprint)
  - Merkle tree for batch certificate verification
  - Chain linking (each entry hashes the previous block)
  - Verification endpoint (check if a hash exists in ledger)

This is a lightweight demo-grade blockchain — for production,
use Ethereum/Hyperledger.
"""

import hashlib
import json
import time
import uuid
from pathlib import Path
from typing import Optional


LEDGER_FILE = Path(__file__).parent.parent / "utils" / "ledger.json"
LEDGER_FILE.parent.mkdir(exist_ok=True)


# ─── SHA-256 Hashing ────────────────────────────────────

def hash_document(file_bytes: bytes) -> str:
    """
    Computes SHA-256 hash of raw document bytes.
    This acts as the document's cryptographic fingerprint.
    """
    return hashlib.sha256(file_bytes).hexdigest()


def hash_pair(a: str, b: str) -> str:
    """Hashes two strings together (for Merkle tree)."""
    combined = (a + b).encode()
    return hashlib.sha256(combined).hexdigest()


# ─── Merkle Tree ────────────────────────────────────────

def build_merkle_root(hashes: list[str]) -> str:
    """
    Builds a Merkle root from a list of document hashes.
    Reduces log2(n) levels to a single root hash.
    """
    if not hashes:
        return hashlib.sha256(b"empty").hexdigest()

    layer = hashes[:]
    if len(layer) % 2 == 1:
        layer.append(layer[-1])  # Duplicate last if odd count

    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            next_layer.append(hash_pair(layer[i], layer[i + 1]))
        layer = next_layer
        if len(layer) > 1 and len(layer) % 2 == 1:
            layer.append(layer[-1])

    return layer[0]


# ─── Ledger (Append-Only Chain) ─────────────────────────

def _load_ledger() -> list[dict]:
    """Load ledger from disk."""
    if LEDGER_FILE.exists():
        try:
            return json.loads(LEDGER_FILE.read_text())
        except Exception:
            return []
    return []


def _save_ledger(ledger: list[dict]) -> None:
    """Persist ledger to disk."""
    LEDGER_FILE.write_text(json.dumps(ledger, indent=2))


def _get_previous_hash(ledger: list[dict]) -> str:
    """Returns hash of last block in chain (genesis = 0000...)."""
    if not ledger:
        return "0" * 64
    return ledger[-1]["block_hash"]


def register_document(
    file_bytes: bytes,
    filename: str,
    doc_type: str = "unknown",
    verdict: str = "UNKNOWN",
    case_id: str = None,
) -> dict:
    """
    Registers a document on the ledger.
    Creates a new block linking to the previous block.

    Returns the created block.
    """
    ledger = _load_ledger()

    doc_hash = hash_document(file_bytes)
    prev_hash = _get_previous_hash(ledger)
    block_index = len(ledger)
    timestamp = time.time()

    # Block data
    block_data = {
        "index": block_index,
        "timestamp": timestamp,
        "case_id": case_id or f"CASE-#{str(uuid.uuid4())[:6].upper()}",
        "filename": filename,
        "doc_type": doc_type,
        "verdict": verdict,
        "document_hash": doc_hash,
        "previous_hash": prev_hash,
    }

    # Block hash = SHA-256 of all block data
    block_str = json.dumps(block_data, sort_keys=True).encode()
    block_hash = hashlib.sha256(block_str).hexdigest()
    block_data["block_hash"] = block_hash

    ledger.append(block_data)
    _save_ledger(ledger)

    return block_data


def verify_document(file_bytes: bytes) -> dict:
    """
    Verifies if a document's hash exists in the ledger.
    Returns verification result with block info if found.
    """
    doc_hash = hash_document(file_bytes)
    ledger = _load_ledger()

    for block in ledger:
        if block.get("document_hash") == doc_hash:
            return {
                "verified": True,
                "document_hash": doc_hash,
                "block_index": block["index"],
                "case_id": block["case_id"],
                "filename": block["filename"],
                "verdict": block["verdict"],
                "registered_at": block["timestamp"],
                "block_hash": block["block_hash"],
                "message": "✅ Document hash found in ForenSight blockchain ledger.",
            }

    return {
        "verified": False,
        "document_hash": doc_hash,
        "message": "❌ Document hash NOT found in ledger. Document may be unregistered or tampered.",
    }


def verify_chain_integrity() -> dict:
    """
    Validates the entire chain by recomputing all block hashes.
    Detects any retroactive tampering with ledger entries.
    """
    ledger = _load_ledger()
    if not ledger:
        return {"valid": True, "blocks": 0, "message": "Ledger is empty."}

    for i, block in enumerate(ledger):
        # Recompute block hash
        block_copy = {k: v for k, v in block.items() if k != "block_hash"}
        block_str = json.dumps(block_copy, sort_keys=True).encode()
        expected_hash = hashlib.sha256(block_str).hexdigest()

        if expected_hash != block["block_hash"]:
            return {
                "valid": False,
                "corrupted_block": i,
                "message": f"⚠️ Chain integrity FAILED at block #{i}. Ledger may have been tampered.",
            }

        # Check chain link
        if i > 0 and block["previous_hash"] != ledger[i - 1]["block_hash"]:
            return {
                "valid": False,
                "corrupted_block": i,
                "message": f"⚠️ Chain link broken at block #{i}. Previous hash mismatch.",
            }

    # Compute merkle root of all document hashes
    all_doc_hashes = [b["document_hash"] for b in ledger]
    merkle_root = build_merkle_root(all_doc_hashes)

    return {
        "valid": True,
        "blocks": len(ledger),
        "merkle_root": merkle_root,
        "latest_block_hash": ledger[-1]["block_hash"],
        "message": f"✅ Chain integrity verified. {len(ledger)} blocks, Merkle root computed.",
    }


def get_ledger_summary() -> dict:
    """Returns high-level stats about the ledger."""
    ledger = _load_ledger()
    verdicts = [b.get("verdict", "UNKNOWN") for b in ledger]
    return {
        "total_documents": len(ledger),
        "forged": verdicts.count("FORGED"),
        "authentic": verdicts.count("AUTHENTIC"),
        "suspicious": verdicts.count("SUSPICIOUS"),
        "blocks": len(ledger),
        "genesis_hash": ledger[0]["block_hash"] if ledger else None,
        "latest_hash": ledger[-1]["block_hash"] if ledger else None,
    }
