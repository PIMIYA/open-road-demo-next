/*** API for get data of all creations ***/

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  // const {query} = req.query;
  // console.log(query);

  try {
    const address = await req.body;
    console.log("s");
    console.log(address);
    // /*** convert string to array ***/
    // const string2array = body.split(",");
    // // /*** convert array to object with key=url ***/
    // const array2object = string2array.map((url: any) => ({ url }));

    // array2object.map((b) => {
    //   console.log(b.url);
    // });
    
    /*** async/await with fetch and map, and then send result to where use api route ***/
    // async function getData() {
    //   const data = Promise.all(
    //     array2object.map(async (i: { url: any; }) => await (await fetch(`${process.env.AkaDropURL}/pools/${i.url}?offset=0&limit=10&state=active`)).json())
    //   )
    //   return data
    // }

    // getData()
    // .then(data => {
    //   // console.log(data)
    //   res.status(200).send({ data })
    // })
    // .catch (err => {
    //     res.status(500).send({ error: 'failed to fetch data' })
    //   })
    


    /*** testing fetch single string, and then send result to where use api route ***/
    const result = await fetch(
          // `https://mars.akaswap.com/drop/api/pools/${array2object[0].url}?offset=0&limit=10&state=active`
            // `https://mars.akaswap.com/drop/api/pools/KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf/1?offset=0&limit=10&state=active`      
            `${process.env.AkaDropURL}/${address}/pools?offset=0&limit=10`
        )

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


