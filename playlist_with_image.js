// Playlist: VR (WebXR) + local audios + YouTube playlist.
// VR loads your A-Frame scene which defaults to /assets/3d/saraswathi.glb.
window.SARASWATI_PLAYLIST = [
  { id:"img-saraswati", type:"image", category:"images", title:"Saraswati (Image)", url:"/assets/images/saraswati.gif" },
  { id:"vr-temple", type:"webxr", title:"VR: Saraswati Temple (WebXR)", url:"/index.html" },

  // Local audio (as provided)
  { id:"Saraswati Namostute", type:"audio", title:"Saraswati Namostute", url:"/assets/audio/Saraswati Namostute.mp3" },
  { id:"Saraswati Dwadash Naam Stotram", type:"audio", title:"Saraswati Dwadash Naam Stotram", url:"/assets/audio/Saraswati Dwadash Naam Stotram.mp3" },
  { id:"Saraswati Chalisa", type:"audio", title:"Saraswati Chalisa", url:"/assets/audio/Saraswati Chalisa.mp3" },
  { id:"Sarasvati Vandana", type:"audio", title:"Sarasvati Vandana", url:"/assets/audio/Sarasvati Vandana.mp3" },
  { id:"Sarasvati Mahabhadra", type:"audio", title:"Sarasvati Mahabhadra", url:"/assets/audio/Sarasvati Mahabhadra.mp3" },
  { id:"Sri Saraswathi Ashtakam", type:"audio", title:"Sri Saraswathi Ashtakam", url:"/assets/audio/Sri Saraswathi Ashtakam.mp3" },

  // Stories (YouTube playlist)
  { id:"yt-stories", type:"youtube_playlist", title:"Saraswati Stories (YouTube Playlist)",
    url:"https://www.youtube.com/playlist?list=PLY7o2LjD14VqHRYMmYtQ1ffw5zNPHYwXf" }
];
