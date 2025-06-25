import rsa
from pathlib import Path
import sys

PRIVATE_KEY_PATH = Path(__file__).resolve().parent / 'private.pem'


def sign_file(path: str) -> Path:
    target = Path(path)
    if not target.is_file():
        raise FileNotFoundError(path)
    private_key = rsa.PrivateKey.load_pkcs1(PRIVATE_KEY_PATH.read_bytes())
    data = target.read_bytes()
    signature = rsa.sign(data, private_key, 'SHA-256')
    sig_path = target.with_suffix(target.suffix + '.sig')
    sig_path.write_bytes(signature)
    return sig_path


def main():
    if len(sys.argv) != 2:
        print('Usage: python sign_file.py <file>')
        sys.exit(1)
    sig_path = sign_file(sys.argv[1])
    print(f'Signature written to {sig_path}')


if __name__ == '__main__':
    main()