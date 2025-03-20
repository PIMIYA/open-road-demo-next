/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  FetchDirectusData,
} from "@/lib/api";
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

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";

export default function Id({
  ownersData,
  data,
  data_from_pool,
  organizers,
  artists,
}) {
  // console.log("current active claimable token data", data_from_pool[0].key);

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
      if (data_from_pool) {
        d.poolId = data_from_pool[0].key;
        d.duration = data_from_pool[0].value.duration;
      } else {
        d.poolId = null;
        d.duration = null;
      }

      return d;
    });
  }

  // return <SingleToken data={data} />;
  return (
    <>
      {data.map((d, index) => {
        return (
          <div key={index}>
            <SingleToken
              data={d}
              ownersData={ownersData}
              organizers={organizers}
              artists={artists}
            />
          </div>
        );
      })}
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [ownersData, data, data_from_pool, organizers, artists] =
    await Promise.all([
      await MainnetAPI(
        `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
      ),
      await TZKT_API(
        `/v1/tokens?contract=${params.params.contract}&tokenId=${params.params.tokenId}`
      ),
      await GetClaimablePoolID(
        contractAddress,
        params.params.contract,
        params.params.tokenId
      ),
      await FetchDirectusData(`/organizers`),
      await FetchDirectusData(`/artists`),
    ]);

  return {
    props: { ownersData, data, data_from_pool, organizers, artists },
  };
}
