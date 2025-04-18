import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name || 'product-image';

  const metadata = JSON.stringify({ name: fileName });
  const boundary = '----PinataFormBoundary' + Math.random().toString(16).slice(2);

  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${file.type}\r\n\r\n`
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="pinataMetadata"\r\n\r\n${metadata}\r\n--${boundary}--`),
  ]);

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', multipartBody, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    return NextResponse.json({ cid: response.data.IpfsHash });
  } catch (error) {
    console.error('[Pinata Upload Error]', error?.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
  }
}
