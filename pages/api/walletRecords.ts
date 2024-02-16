/*** API for get data of all creations ***/
import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const body = await req.body;
    /*** convert string to array ***/
    const string2array = body.split(",");
    /*** convert array to object with key=url ***/
    const array2object = string2array.map((url: any) => ({ url }));
    // array2object.map((b) => {
    //   console.log(b.url);
    // });
    
    /*** async/await with fetch and map, and then send result to where use api route ***/
    async function getData() {
      const data = Promise.all(
        array2object.map(async (i: { url: any; }) => await (await fetch(`${process.env.MainnetURL}/fa2tokens/${i.url}`)).json())
      )
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