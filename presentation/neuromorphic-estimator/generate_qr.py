#!/usr/bin/env python3
"""
Generate QR code for the seminar presentation.
Run this after deployment to get a QR code for your slide.
"""

import qrcode
import argparse
import sys

def generate_qr(url, output_file="qr_code.png", size=10):
    """Generate a QR code for the given URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_file)
    print(f"QR code saved to {output_file}")
    print(f"URL: {url}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate QR code for the seminar")
    parser.add_argument("url", help="The URL to encode in the QR code")
    parser.add_argument("-o", "--output", default="qr_code.png", help="Output file name")
    parser.add_argument("-s", "--size", type=int, default=10, help="QR code box size (default: 10)")

    args = parser.parse_args()

    try:
        generate_qr(args.url, args.output, args.size)
    except Exception as e:
        print(f"Error generating QR code: {e}", file=sys.stderr)
        sys.exit(1)
