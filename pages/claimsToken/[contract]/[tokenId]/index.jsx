/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { TZKT_API, MainnetAPI } from "@/lib/api";
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

export default function Id({ ownersData, data }) {
  console.log(ownersData);

  // TODO: remove dummy data after api ready
  if (data) {
    data = data.map((d) => {
      d.eventPlace = d.metadata.event_location
        ? d.metadata.event_location
        : getRandomPlace();
      d.creator = d.metadata.organizer
        ? d.metadata.organizer
        : getRandomCreator();
      d.objectType = getRandomObjectType();
      d.eventDate = getRandomPeriod();
      d.start_time = d.metadata.start_time;
      d.end_time = d.metadata.end_time;

      return d;
    });
  }

  // return <SingleToken data={data} />;
  return (
    <>
      {data.map((d, index) => {
        return (
          <div key={index}>
            <SingleToken data={d} ownersData={ownersData} />
          </div>
        );
      })}
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [ownersData, data] = await Promise.all([
    await MainnetAPI(
      `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
    ),
    await TZKT_API(
      `/v1/tokens?contract=${params.params.contract}&tokenId=${params.params.tokenId}`
    ),
  ]);

  return {
    props: { ownersData, data },
  };
}
