/*** API for get data of role ***/

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  
  const address = await req.body;
  /*** fetch single string, and then send result to where use api route ***/
  async function getData() {
    const result = await fetch( `${process.env.WalletRoleURL}/${address}`)
    const data = await result.json();
    return data
  }
  
  getData()

  .then(data => {
    // console.log(data)
    res.status(200).send({ data })
  })
  .catch (err => {
    res.status(500).send({ error: 'failed to fetch data' })
  })
  
}

export const config = {
  api: {
    externalResolver: true,
  },
}


