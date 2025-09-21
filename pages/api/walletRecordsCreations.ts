/*** API for get data of all creations ***/
import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const body = await req.body;
    // console.log("body", body);

    async function getData() {
      const data =  (await fetch(`${process.env.TZKT_URL}/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&metadata.creators.as=*${body}*`)).json();      
      return data;
    }

    getData()
    .then(data => {
      res.status(200).send({ data });
    })
    .catch (err => {
      res.status(500).send({ error: 'failed to fetch data' });
    });
}

export const config = {
  api: {
    externalResolver: true,
  },
}