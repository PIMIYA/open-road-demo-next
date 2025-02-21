/*** API for get data of all creations ***/
import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // console.log("req.body", req.body);
  const body2 = req.body.split(".");
  // console.log("address", body2[1]);
  const body = await body2[0];
  // console.log("body", body);
  // const body = await req.body;
  
  // Convert string to array
  const string2array = body.split(",");
  const contractAndTokenId = string2array.map((i: any) => {
    const tid = i.split("/");
    const contract = tid[0];
    const tokenId = tid[1];
    return { contract, tokenId };
  });
  // Filter out only contract 測試：KT1PBwbt2aEWunSse2E3tCc5hbYJ3gbqsNBN 正式：KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW
  let filterd = contractAndTokenId.filter((e: { contract: string }) => e.contract == "KT1PBwbt2aEWunSse2E3tCc5hbYJ3gbqsNBN");
    // Create a array of tokenId
    let tokenIdArray: number[] = [];
    filterd.map((cAndT: { contract: string; tokenId: number }) => {
      tokenIdArray.push(cAndT.tokenId);
    });

    // console.log("tokenIdArray", tokenIdArray);

    async function getData() {
      const data =  (await fetch(`${process.env.TZKT_URL}/v1/tokens/transfers?token.contract=KT1PBwbt2aEWunSse2E3tCc5hbYJ3gbqsNBN&token.tokenId.in=${tokenIdArray}&from=${body2[1]}`)).json();      
      return data;
    }
    // if filterd is empty, then not to fetch data
    if(tokenIdArray.length > 0) {
      getData()
    .then(data => {
      res.status(200).send({ data });
    })
    .catch (err => {
      res.status(500).send({ error: 'failed to fetch data' });
    });
    }
    
}

export const config = {
  api: {
    externalResolver: true,
  },
}