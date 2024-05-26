/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { TZKT_API } from "@/lib/api";
/* Components */
import SingleToken from "@/components/singleToken";
/* Routing */
import { useRouter } from "next/router";

import {
  getRandomCreator,
  getRandomObjectType,
  getRandomPeriod,
  getRandomPlace,
} from "@/lib/dummy";

export default function Id({ data }) {
  // console.log(data);

  // TODO: remove dummy data after api ready
  if (data) {
    data = data.map((d) => {
      d.creator = getRandomCreator();
      d.objectType = getRandomObjectType();
      d.eventDate = getRandomPeriod();
      d.eventPlace = getRandomPlace();

      return d;
    });
  }

  // return <SingleToken data={data} />;
  return (
    <>
      {data.map((d, index) => {
        return (
          <div key={index}>
            <SingleToken data={d} />
          </div>
        );
      })}
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [data] = await Promise.all([
    // await MainnetAPI(
    //   `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
    // ),
    await TZKT_API(
      `/v1/tokens?contract=${params.params.contract}&tokenId=${params.params.tokenId}`
    ),
  ]);

  return {
    props: { data },
  };
}
