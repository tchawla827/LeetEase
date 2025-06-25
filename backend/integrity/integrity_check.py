import rsa
from pathlib import Path

PUBLIC_KEY_PATH = Path(__file__).resolve().parent / 'public.pem'


def verify_file_integrity(path: str) -> bool:
    try:
        public_key = rsa.PublicKey.load_pkcs1(PUBLIC_KEY_PATH.read_bytes())
        target = Path(path)
        signature_path = target.with_suffix(target.suffix + '.sig')
        data = target.read_bytes()
        signature = signature_path.read_bytes()
        rsa.verify(data, signature, public_key)
        return True
    except Exception:
        return False