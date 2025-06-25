import rsa
from pathlib import Path

KEY_SIZE = 2048

PRIVATE_KEY_PATH = Path(__file__).resolve().parent / 'private.pem'
PUBLIC_KEY_PATH = Path(__file__).resolve().parent / 'public.pem'


def main() -> None:
    public_key, private_key = rsa.newkeys(KEY_SIZE)
    PRIVATE_KEY_PATH.write_bytes(private_key.save_pkcs1('PEM'))
    PUBLIC_KEY_PATH.write_bytes(public_key.save_pkcs1('PEM'))
    print(f"Keys generated: {PRIVATE_KEY_PATH} {PUBLIC_KEY_PATH}")


if __name__ == '__main__':
    main()