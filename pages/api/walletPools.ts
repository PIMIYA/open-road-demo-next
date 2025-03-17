/*** API for get data of all poolUid ***/

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const {query} = req.query;
  // console.log(query);
  try {
    const address = await req.body;
    // console.log(address);
    /***  fetch single string, and then send result to where use api route ***/
    const result = await fetch( `${process.env.AKADROP_URL}/${address}/pools?offset=0&limit=0`)
    const data = await result.json();
    res.status(200).send({ data })
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' })
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}


