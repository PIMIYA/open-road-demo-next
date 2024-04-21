import { AkaDropAPI } from '@/lib/api';

import { Box, Container, Stack, Typography } from '@mui/material';
import CreatorCardGrid from '@/components/creator/CreatorCardGrid';
import { getRandomText } from '@/lib/dummy';

export default function ({ address, pools }) {

  // TODO: get introduction from real data
  const creatorName = 'The Creator Name';
  const description = getRandomText();

  return (
    <Container maxWidth="lg">
      <Stack direction={
        { md: 'column', lg: 'row' }
      } spacing={4}>
        <Box
          width={{
            md: '100%',
            lg: 300
          }}
        >
          {/* TODO: filter */}
          {/* <Box>
            filter
          </Box> */}
        </Box>
        <Box width={'100%'}> {/* right */}
          {/* TODO: generative image */}
          {/* <Box
            width={'100%'}
            height={400}
            bgcolor={'white'}
            padding={2}
            mb={4}
          >
            generative image
          </Box> */}
          <Box mb={10}>
            <Typography variant="h5">
              {creatorName}
            </Typography>
            <Typography variant="body1">
              {description}
            </Typography>
          </Box>

          <CreatorCardGrid rawPools={pools} />
        </Box>
      </Stack>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const query = await context.query;
  const address = query.address;

  let [pools] = await Promise.all([
    await AkaDropAPI(`/${address}/pools?offset=0&limit=10`),
  ]);

  return {
    props: { address, pools },
  };
}
