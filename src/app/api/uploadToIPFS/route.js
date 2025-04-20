import { NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY, // Optional if not using gateway access
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload the file to IPFS using Pinata's new SDK
    const uploaded = await pinata.upload.public.file(file);

    return NextResponse.json({
      cid: uploaded.cid,
      name: uploaded.name,
      size: uploaded.size,
      url: `${process.env.PINATA_GATEWAY}/ipfs/${uploaded.cid}`,
    });
  } catch (error) {
    console.error('[Pinata Upload Error]', error);
    return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
  }
}
