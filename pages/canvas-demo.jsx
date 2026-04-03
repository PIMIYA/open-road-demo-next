import { Box, Container, Typography, Stack, Divider, Chip } from "@mui/material";
import GenerativeCanvas from "@/components/wallet/GenerativeCanvas";
import { calcTagWeights, calcCategoryDist, TAG_COLORS } from "@/lib/canvas/config";

// --- User A: Music/Design enthusiast, heavy exhibition-goer ---
const userA = {
  name: "User A — 音樂 × 設計 × 展覽",
  nfts: [
    { id: "a1",  tags: ["視覺藝術", "新媒體"], category: "展覽" },
    { id: "a2",  tags: ["音樂", "新媒體"],     category: "展覽" },
    { id: "a3",  tags: ["音樂", "設計"],       category: "展覽" },
    { id: "a4",  tags: ["音樂", "設計"],       category: "課程" },
    { id: "a5",  tags: ["音樂", "設計"],       category: "工作坊" },
    { id: "a6",  tags: ["音樂", "設計"],       category: "分享會／同好會／見面會" },
    { id: "a7",  tags: ["音樂", "人文"],       category: "研討會／論壇／座談" },
    { id: "a8",  tags: ["音樂", "設計"],       category: "展覽" },
    { id: "a9",  tags: ["音樂", "設計"],       category: "展覽" },
    { id: "a10", tags: ["音樂", "設計"],       category: "展覽" },
    { id: "a11", tags: ["設計", "建築"],       category: "展覽" },
    { id: "a12", tags: ["音樂"],               category: "表演" },
    { id: "a13", tags: ["設計", "新媒體"],     category: "展覽" },
    { id: "a14", tags: ["音樂", "設計"],       category: "展覽" },
    { id: "a15", tags: ["音樂"],               category: "展覽" },
  ],
};

// --- User B: Theater/Dance lover, performance-focused ---
const userB = {
  name: "User B — 戲劇 × 舞蹈 × 表演",
  nfts: [
    { id: "b1",  tags: ["戲劇"],               category: "表演" },
    { id: "b2",  tags: ["舞蹈"],               category: "表演" },
    { id: "b3",  tags: ["戲劇", "舞蹈"],       category: "表演" },
    { id: "b4",  tags: ["戲劇"],               category: "表演" },
    { id: "b5",  tags: ["舞蹈", "音樂"],       category: "表演" },
    { id: "b6",  tags: ["戲劇"],               category: "研討會／論壇／座談" },
    { id: "b7",  tags: ["舞蹈"],               category: "工作坊" },
    { id: "b8",  tags: ["戲劇", "人文"],       category: "導覽" },
    { id: "b9",  tags: ["舞蹈"],               category: "表演" },
    { id: "b10", tags: ["戲劇", "舞蹈"],       category: "節祭／展會／市集" },
    { id: "b11", tags: ["戲劇"],               category: "表演" },
    { id: "b12", tags: ["舞蹈", "音樂"],       category: "表演" },
  ],
};

// --- User C: Tech/Science hacker, hackathon & workshop heavy ---
const userC = {
  name: "User C — 新媒體 × 科學 × 黑客松",
  nfts: [
    { id: "c1",  tags: ["新媒體", "元宇宙"],   category: "黑客松" },
    { id: "c2",  tags: ["新媒體", "科學"],     category: "黑客松" },
    { id: "c3",  tags: ["科學"],               category: "工作坊" },
    { id: "c4",  tags: ["新媒體"],             category: "黑客松" },
    { id: "c5",  tags: ["元宇宙", "新媒體"],   category: "展覽" },
    { id: "c6",  tags: ["科學", "新媒體"],     category: "研討會／論壇／座談" },
    { id: "c7",  tags: ["新媒體"],             category: "黑客松" },
    { id: "c8",  tags: ["科學", "設計"],       category: "工作坊" },
    { id: "c9",  tags: ["新媒體", "元宇宙"],   category: "黑客松" },
    { id: "c10", tags: ["科學"],               category: "課程" },
    { id: "c11", tags: ["新媒體", "科學"],     category: "黑客松" },
    { id: "c12", tags: ["元宇宙"],             category: "展覽" },
    { id: "c13", tags: ["新媒體"],             category: "工作坊" },
  ],
};

function TagBar({ weights }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
      {weights.map(({ tag, color, weight }) => (
        <Chip
          key={tag}
          label={`${tag} ${Math.round(weight * 100)}%`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: color,
            color: color,
            fontSize: 10,
            mb: 0.5,
          }}
        />
      ))}
    </Stack>
  );
}

function CategoryBar({ dist }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
      {dist.map(({ category, shape, count }) => (
        <Chip
          key={category}
          label={`${category} ×${count} (${shape})`}
          size="small"
          sx={{ fontSize: 10, mb: 0.5 }}
        />
      ))}
    </Stack>
  );
}

function UserSection({ user }) {
  const tagWeights = calcTagWeights(user.nfts);
  const categoryDist = calcCategoryDist(user.nfts);

  return (
    <Box sx={{ mb: 8 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>{user.name}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.6 }}>
        {user.nfts.length} NFTs
      </Typography>

      <Box sx={{ my: 2 }}>
        <GenerativeCanvas nfts={user.nfts} width={800} height={400} />
      </Box>

      <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.8 }}>
        Tag distribution:
      </Typography>
      <TagBar weights={tagWeights} />

      <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.8 }}>
        Category distribution:
      </Typography>
      <CategoryBar dist={categoryDist} />
    </Box>
  );
}

// --- User D: Film/Humanities scholar, festivals & meetups ---
const userD = {
  name: "User D — 電影 × 人文 × 市集 × 分享會",
  nfts: [
    { id: "d1",  tags: ["電影", "人文"],       category: "節祭／展會／市集" },
    { id: "d2",  tags: ["電影"],               category: "節祭／展會／市集" },
    { id: "d3",  tags: ["人文", "出版"],       category: "分享會／同好會／見面會" },
    { id: "d4",  tags: ["電影", "戲劇"],       category: "表演" },
    { id: "d5",  tags: ["人文"],               category: "導覽" },
    { id: "d6",  tags: ["電影", "人文"],       category: "分享會／同好會／見面會" },
    { id: "d7",  tags: ["出版"],               category: "研討會／論壇／座談" },
    { id: "d8",  tags: ["人文", "電影"],       category: "節祭／展會／市集" },
    { id: "d9",  tags: ["電影"],               category: "展覽" },
    { id: "d10", tags: ["人文", "出版"],       category: "分享會／同好會／見面會" },
    { id: "d11", tags: ["電影"],               category: "節祭／展會／市集" },
    { id: "d12", tags: ["人文"],               category: "導覽" },
  ],
};

// --- User E: Hip-hop/Architecture street culture ---
const userE = {
  name: "User E — 說唱 × 建築 × 工作坊 × 黑客松",
  nfts: [
    { id: "e1",  tags: ["說唱"],               category: "表演" },
    { id: "e2",  tags: ["說唱", "音樂"],       category: "表演" },
    { id: "e3",  tags: ["建築"],               category: "展覽" },
    { id: "e4",  tags: ["建築", "設計"],       category: "導覽" },
    { id: "e5",  tags: ["說唱"],               category: "工作坊" },
    { id: "e6",  tags: ["建築"],               category: "工作坊" },
    { id: "e7",  tags: ["說唱", "音樂"],       category: "節祭／展會／市集" },
    { id: "e8",  tags: ["建築", "設計"],       category: "展覽" },
    { id: "e9",  tags: ["說唱"],               category: "黑客松" },
    { id: "e10", tags: ["建築"],               category: "課程" },
    { id: "e11", tags: ["說唱", "建築"],       category: "工作坊" },
    { id: "e12", tags: ["說唱"],               category: "表演" },
    { id: "e13", tags: ["建築"],               category: "研討會／論壇／座談" },
    { id: "e14", tags: ["說唱", "音樂"],       category: "分享會／同好會／見面會" },
  ],
};

// --- User F: Publishing/Visual arts intellectual ---
const userF = {
  name: "User F — 出版 × 視覺藝術 × 課程 × 研討會",
  nfts: [
    { id: "f1",  tags: ["出版"],               category: "研討會／論壇／座談" },
    { id: "f2",  tags: ["視覺藝術"],           category: "展覽" },
    { id: "f3",  tags: ["出版", "人文"],       category: "課程" },
    { id: "f4",  tags: ["視覺藝術", "設計"],   category: "展覽" },
    { id: "f5",  tags: ["出版"],               category: "分享會／同好會／見面會" },
    { id: "f6",  tags: ["視覺藝術"],           category: "工作坊" },
    { id: "f7",  tags: ["出版", "科學"],       category: "研討會／論壇／座談" },
    { id: "f8",  tags: ["視覺藝術"],           category: "展覽" },
    { id: "f9",  tags: ["出版"],               category: "課程" },
    { id: "f10", tags: ["視覺藝術", "人文"],   category: "導覽" },
    { id: "f11", tags: ["出版"],               category: "研討會／論壇／座談" },
    { id: "f12", tags: ["視覺藝術"],           category: "展覽" },
    { id: "f13", tags: ["出版", "視覺藝術"],   category: "節祭／展會／市集" },
  ],
};

export default function CanvasDemo() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h1" sx={{ mb: 2 }}>
        Generative Canvas Demo
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, opacity: 0.6 }}>
        Each canvas is generated from a user&apos;s NFT collection. Category → geometric shape, Tag → gradient color.
      </Typography>

      <Divider sx={{ mb: 6 }} />

      <UserSection user={userA} />
      <Divider sx={{ mb: 6 }} />
      <UserSection user={userB} />
      <Divider sx={{ mb: 6 }} />
      <UserSection user={userC} />
      <Divider sx={{ mb: 6 }} />
      <UserSection user={userD} />
      <Divider sx={{ mb: 6 }} />
      <UserSection user={userE} />
      <Divider sx={{ mb: 6 }} />
      <UserSection user={userF} />
    </Container>
  );
}
