import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 3000;

// Enable JSON parser
app.use(express.json());

// Enable CORS for mobile webview requests (origin: https://localhost, file://, etc.)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Telegram-Bot-Api-Secret-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// API: Fetch and scrape latest channel posts (CORS-free for front-end)
app.get('/api/telegram-feed', async (req, res) => {
  const channel = req.query.channel as string || 'da_mine_dewa';
  // Standardize name - remove @ or t.me reference
  const cleanChannel = channel
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/t\.me\//, '')
    .split('/')[0];

  if (!cleanChannel) {
    return res.status(400).json({ error: 'Invalid telegram channel name' });
  }

  try {
    const scrapedPostIds = new Set<string>();

    // Helper to scrape a single URL
    async function scrapePage(url: string) {
      try {
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });
        if (!resp.ok) return null;
        return await resp.text();
      } catch (e) {
        console.error('Failed to fetch page URL:', url, e);
        return null;
      }
    }

    // Helper to parse parsed HTML text via cheerio
    function parseHtmlPosts(htmlText: string) {
      const pagePosts: any[] = [];
      const $page = cheerio.load(htmlText);
      
      $page('.tgme_widget_message_wrap').each((_, element) => {
        const $wrap = $page(element);
        const $post = $wrap.find('.tgme_widget_message');
        
        // Post ID and URL representation
        const dataPostAttr = $post.attr('data-post') || '';
        const parts = dataPostAttr.split('/');
        const postId = parts[parts.length - 1] || '';
        
        if (!postId || scrapedPostIds.has(postId)) return;
        scrapedPostIds.add(postId);

        const postUrl = dataPostAttr ? `https://t.me/${dataPostAttr}` : `https://t.me/${cleanChannel}`;

        // Views
        const views = $post.find('.tgme_widget_message_views').text().trim();

        // Date / Timestamp
        const $time = $post.find('.tgme_widget_message_info time');
        const datetime = $time.attr('datetime') || '';
        const timeLabel = $time.text().trim();

        // Message content
        const $textEl = $post.find('.tgme_widget_message_text');
        const plainText = $textEl.text().trim();
        const htmlTextContent = $textEl.html();

        // Process Text Links (converting relative TG links to absolute Web Client links / standard links)
        let parsedHtmlText = htmlTextContent || '';
        if (htmlTextContent) {
          const $parsedText = cheerio.load(htmlTextContent, null, false);
          $parsedText('a').each((_, a) => {
            const href = $parsedText(a).attr('href');
            if (href && href.startsWith('/')) {
              $parsedText(a).attr('href', `https://t.me${href}`);
              $parsedText(a).attr('target', '_blank');
            }
          });
          parsedHtmlText = $parsedText.html();
        }

        // Photos
        let photoUrl = '';
        const photoUrls: string[] = [];
        const $photoEl = $post.find('.tgme_widget_message_photo_wrap');
        if ($photoEl.length > 0) {
          $photoEl.each((_, el) => {
            const style = cheerio.load(el)(el).attr('style') || '';
            const match = style.match(/background-image:\s*url\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i);
            if (match && match[1]) {
              photoUrls.push(match[1]);
            }
          });
          if (photoUrls.length > 0) {
            photoUrl = photoUrls[0];
          }
        }

        // Videos
        let hasVideo = $post.find('.tgme_widget_message_video, .tgme_widget_message_video_player, video').length > 0;
        let videoUrl = '';
        let videoThumbUrl = '';
        const $videoEl = $post.find('.tgme_widget_message_video, video');
        if ($videoEl.length > 0) {
          videoUrl = $videoEl.attr('src') || '';
        }
        const $videoPlayer = $post.find('.tgme_widget_message_video_player');
        if ($videoPlayer.length > 0) {
          const style = $videoPlayer.attr('style') || '';
          const match = style.match(/background-image:\s*url\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i);
          if (match && match[1]) {
            videoThumbUrl = match[1];
          }
        }

        // Audio / Voice Note
        let hasAudio = $post.find('.tgme_widget_message_voice, .tgme_widget_message_audio, .tgme_widget_message_audio_player, audio').length > 0;
        let audioUrl = '';
        let audioTitle = '';
        let audioDuration = '';
        const $audioEl = $post.find('audio');
        if ($audioEl.length > 0) {
          audioUrl = $audioEl.attr('src') || '';
        }
        const $voiceName = $post.find('.tgme_widget_message_voice_name, .tgme_widget_message_audio_title, .tgme_widget_message_document_title');
        if ($voiceName.length > 0) {
          audioTitle = $voiceName.first().text().trim();
        }
        const $voiceDuration = $post.find('.tgme_widget_message_voice_duration, .tgme_widget_message_audio_duration, .tgme_widget_message_document_extra');
        if ($voiceDuration.length > 0) {
          audioDuration = $voiceDuration.first().text().trim();
        }

        // General Documents / Files
        let hasFile = $post.find('.tgme_widget_message_document').length > 0 && !hasAudio;
        let fileName = '';
        let fileSize = '';
        if (hasFile) {
          fileName = $post.find('.tgme_widget_message_document_title').first().text().trim();
          fileSize = $post.find('.tgme_widget_message_document_extra').first().text().trim();
        }

        // Reactions / Emojis
        const reactions: any[] = [];
        const $reactionsContainer = $post.find('.tgme_widget_message_inline_reactions');
        if ($reactionsContainer.length > 0) {
          $reactionsContainer.find('.tgme_widget_message_inline_reaction').each((_, reactionElement) => {
            const $r = $page(reactionElement);
            const emoji = $r.find('.emoji, .tgme_widget_message_inline_reaction_emoji').first().text().trim() || '';
            const count = $r.find('.tgme_widget_message_inline_reaction_count').first().text().trim() || '0';
            if (emoji) {
              reactions.push({ emoji, count });
            }
          });
        }

        // Links Preview
        let linkPreview: any = null;
        const $preview = $post.find('.tgme_widget_message_link_preview');
        if ($preview.length > 0) {
          const siteName = $preview.find('.link_preview_site_name').text().trim();
          const previewTitle = $preview.find('.link_preview_title').text().trim();
          const previewDesc = $preview.find('.link_preview_description').text().trim();
          const previewUrl = $preview.attr('href') || '';
          
          let previewPhotoUrl = '';
          const $previewPhoto = $preview.find('.link_preview_image, .link_preview_right_image');
          if ($previewPhoto.length > 0) {
            const style = $previewPhoto.attr('style') || '';
            const match = style.match(/background-image:\s*url\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i);
            if (match && match[1]) {
              previewPhotoUrl = match[1];
            }
          }

          linkPreview = {
            siteName,
            title: previewTitle,
            description: previewDesc,
            url: previewUrl,
            photoUrl: previewPhotoUrl
          };
        }

        // Author Name signature
        const authorName = $post.find('.tgme_widget_message_from_author').text().trim() || $post.find('.tgme_widget_message_author').text().trim() || '';

        // Only push messages with content
        if (plainText || photoUrl || hasVideo || hasAudio || hasFile) {
          pagePosts.push({
            id: postId,
            postUrl,
            text: plainText,
            htmlText: parsedHtmlText,
            date: datetime,
            timeLabel,
            views,
            photoUrl,
            photoUrls,
            hasVideo,
            videoUrl,
            videoThumbUrl,
            hasAudio,
            audioUrl,
            audioTitle: audioTitle || 'غږیز فایل / پیغام',
            audioDuration,
            hasFile,
            fileName: fileName || 'فايل / سند',
            fileSize,
            reactions,
            linkPreview,
            authorName
          });
        }
      });
      return pagePosts;
    }

    // Fetch Page 1
    const beforeVal = req.query.before as string || '';
    const page1Url = beforeVal 
      ? `https://t.me/s/${cleanChannel}?before=${beforeVal}`
      : `https://t.me/s/${cleanChannel}`;
    
    const html1 = await scrapePage(page1Url);
    if (!html1) {
      throw new Error(`Telegram returned status error`);
    }

    const $ = cheerio.load(html1);

    // Metadata extraction
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    
    const title = ogTitle || $('.tgme_channel_info_header_title').text().trim() || `@${cleanChannel}`;
    const subscribers = $('.tgme_channel_info_counter').text().trim() || 'Public Channel';
    const description = ogDescription || $('.tgme_channel_info_description').text().trim() || 'No description available.';

    // Extract posts from page 1
    const allPosts: any[] = [];
    const page1Posts = parseHtmlPosts(html1);
    allPosts.push(...page1Posts);

    // Try fetching Page 2 for archive load capacity
    const postIdsNumeric = page1Posts.map(p => parseInt(p.id)).filter(id => !isNaN(id));
    if (postIdsNumeric.length > 0) {
      const minPostId = Math.min(...postIdsNumeric);
      const url2 = `https://t.me/s/${cleanChannel}?before=${minPostId}`;
      const html2 = await scrapePage(url2);
      if (html2) {
        const page2Posts = parseHtmlPosts(html2);
        allPosts.push(...page2Posts);

        // Try page 3 as well so we have up to 50-60 total posts!
        const postIdsNumeric2 = page2Posts.map(p => parseInt(p.id)).filter(id => !isNaN(id));
        if (postIdsNumeric2.length > 0) {
          const minPostId2 = Math.min(...postIdsNumeric2);
          const url3 = `https://t.me/s/${cleanChannel}?before=${minPostId2}`;
          const html3 = await scrapePage(url3);
          if (html3) {
            const page3Posts = parseHtmlPosts(html3);
            allPosts.push(...page3Posts);
          }
        }
      }
    }

    // Return posts sorted latest first (highest ID first)
    const sortedPosts = allPosts.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    });

    res.json({
      channelInfo: {
        username: cleanChannel,
        title,
        avatarUrl: ogImage || 'https://telegram.org/img/t_logo.png',
        subscribers,
        description,
      },
      posts: sortedPosts
    });

  } catch (error: any) {
    console.error('Scraping Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve Telegram channel messages',
      details: error.message
    });
  }
});

// API: Proxy call to verify the user's Bot Token integrity (getMe)
app.post('/api/bot-test-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Connection failed', details: error.message });
  }
});

// API: Proxy call to check bot connection status with the channel (getChat)
app.post('/api/bot-test-channel', async (req, res) => {
  const { token, channel } = req.body;
  if (!token || !channel) {
    return res.status(400).json({ error: 'Token and channel username are required' });
  }

  const cleanChannel = channel.trim().startsWith('@') ? channel.trim() : `@${channel.trim()}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(cleanChannel)}`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Connection failed', details: error.message });
  }
});

// API: Proxy call to forward contact us messages to the Telegram Bot (accessible only to bot admin)
app.post('/api/send-contact-message', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'نوم او پیغام دواړه اړین دي.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID is missing in environment variables');
    return res.status(400).json({
      error: 'configuration_missing',
      message: 'د پیغام لیږلو لپاره د ټلیګرام روباټ او اډمین معلومات نه دي تنظیم شوي. مهرباني وکړئ TELEGRAM_BOT_TOKEN او TELEGRAM_ADMIN_CHAT_ID په چاپېریالي متغیرونو (Environment Variables/Secrets) کې اضافه کړئ.'
    });
  }

  try {
    const text = `📬 *د اړیکې پیغام د اپلیکیشن څخه*\n\n👤 *شخص:* ${name}\n\n💬 *پیغام:*\n${message}`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Telegram API error response:', result);
      return res.status(500).json({ error: 'telegram_api_error', message: result.description || 'د ټلیګرام روباټ له لارې د استولو تېروتنه رامنځته شوه.' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send Telegram message:', error);
    return res.status(500).json({ error: 'server_error', message: error.message });
  }
});

// Mount Vite middleware / static files router
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Feed Server running on http://localhost:${PORT}`);
  });
}

startServer();
