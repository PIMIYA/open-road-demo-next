import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Chip,
  Alert
} from '@mui/material';

// 預定義的測試檔案列表
const testFiles = [
  { name: 'test.jpg', type: 'image', description: 'JPEG 圖片' },
  { name: 'test.gif', type: 'image', description: 'GIF 動畫' },
  { name: 'test.mp4', type: 'video', description: 'MP4 影片' },
  { name: 'test.mp3', type: 'audio', description: 'MP3 音訊' },
  { name: 'test-3d.zip', type: '3d', description: '3D 模型 ZIP' },
  { name: 'test-html.zip', type: 'html', description: 'HTML 網站 ZIP' },
  { name: 'test-p5+html.zip', type: 'html', description: 'P5.js + HTML ZIP' },
];

const getTypeColor = (type) => {
  const colors = {
    image: 'primary',
    video: 'secondary',
    audio: 'success',
    '3d': 'warning',
    html: 'info',
  };
  return colors[type] || 'default';
};

const getTypeIcon = (type) => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    '3d': '🎲',
    html: '🌐',
  };
  return icons[type] || '📄';
};

export default function TestRenderIndex() {
  const [availableFiles, setAvailableFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 直接設定所有檔案為可用，因為它們在 /public/test/ 目錄中
    setAvailableFiles(testFiles.map(file => ({ ...file, available: true })));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Test Files...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  const availableCount = availableFiles.filter(f => f.available).length;
  const totalCount = availableFiles.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Render Media Test Suite
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          測試 render-media 組件的各種檔案格式渲染功能
        </Typography>
        <Typography variant="body2" color="text.secondary">
          可用檔案: {availableCount}/{totalCount}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {availableFiles.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.name}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: file.available ? 1 : 0.6
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="span" sx={{ mr: 1 }}>
                    {getTypeIcon(file.type)}
                  </Typography>
                  <Typography variant="h6" component="div" noWrap>
                    {file.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {file.description}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={file.type.toUpperCase()} 
                    color={getTypeColor(file.type)}
                    size="small"
                  />
                  {!file.available && (
                    <Chip 
                      label="NOT FOUND" 
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </CardContent>
              
              <CardActions>
                {file.available ? (
                  <Button 
                    component={Link}
                    href={`/test_render/${file.name}`}
                    variant="contained"
                    fullWidth
                  >
                    Test Render
                  </Button>
                ) : (
                  <Button 
                    disabled
                    fullWidth
                  >
                    File Not Found
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📁 測試檔案位置
        </Typography>
        <Typography variant="body2" color="text.secondary">
          請確保以下檔案存在於 <code>/public/test/</code> 目錄中：
        </Typography>
        <Box component="pre" sx={{ mt: 2, fontSize: '0.875rem' }}>
          {testFiles.map(file => `- ${file.name}`).join('\n')}
        </Box>
      </Box>
    </Container>
  );
}
