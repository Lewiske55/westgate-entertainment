const CONFIG = {
  TMDB: {
    API_KEY: '1cf50e6248dc270629e802686245c2c8',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_URL: 'https://image.tmdb.org/t/p/w500',
    IMAGE_URL_ORIGINAL: 'https://image.tmdb.org/t/p/original',
    PLACEHOLDER_IMAGE: 'https://placehold.co/500x750/1f2937/9ca3af?text=No+Poster'
  },
  CONTACT: {
    PHONE: '+254740513137',
    WHATSAPP: '254740513137',
    LOCATION: 'Westgate Ent, Nakuru'
  },
  // PesaPal configuration — replace with your live credentials
  PESAPAL: {
    // Use sandbox for testing, live for production
    BASE_URL: 'https://cybqa.pesapal.com/pesapalv3', // sandbox
    // BASE_URL: 'https://pay.pesapal.com/v3',         // production
    CONSUMER_KEY: 'YOUR_PESAPAL_CONSUMER_KEY',
    CONSUMER_SECRET: 'YOUR_PESAPAL_CONSUMER_SECRET',
    IPN_URL: 'https://yourdomain.com/api/pesapal/ipn',
    REDIRECT_URL: 'https://yourdomain.com/payment/callback',
    BUSINESS_NAME: 'Westgate Entertainment'
  },
  PRODUCTS: [
    { id: 1,  name: 'Oraimo Space Buds OTW-630',   price: 5000, image: 'https://i.pinimg.com/736x/a8/40/4e/a8404e90b639f79a753d4f53b15c2dae.jpg' },
    { id: 2,  name: 'Itel Buds Ace',                price: 1500, image: 'https://i.pinimg.com/1200x/e0/b3/9a/e0b39a1a805d0304a7dabb891848c20a.jpg' },
    { id: 3,  name: 'Amaya Buds TK-05',             price: 1500, image: 'https://imgs.search.brave.com/BoODFWA7UnwWRg11djCk5XfDOT4w-M5eRpIRJVNeLRo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2Fia29wYXNhbC5j/b20ubnAvd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvMjAy/NDA4Mjk4NDE0LXNj/YWxlZC5qcGc' },
    { id: 4,  name: 'Amaya Buds ATW-19',            price: 1000, image: 'https://imgs.search.brave.com/YptXVIxqhkjhlmD96O2V5r088s6GBSMEASQbYotKMoE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdW5j/b21sdGQuY29tL2Nk/bi9zaG9wL2ZpbGVz/L1doYXRzQXBwSW1h/Z2UyMDI1LTA4LTE1/YXQxMC4wNS4zMEFN/LmpwZz92PTE3NTUy/NzI4OTMmd2lkdGg9/MTQ0NQ' },
    { id: 5,  name: 'ABJ Wireless Earbuds U37',     price: 900,  image: 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/14/6921723/4.jpg?4658' },
    { id: 6,  name: 'M19 TWS Wireless Earpods',     price: 800,  image: 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/28/5197523/1.jpg?3258' },
    { id: 7,  name: 'M10 TWS Wireless Earpods',     price: 700,  image: 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/55/0230523/7.jpg?6194' },
    { id: 8,  name: 'TWS Stereo I-16',              price: 500,  image: 'https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/85/1818523/1.jpg?5451' },
    { id: 9,  name: 'Memory Card 64 GB',            price: 1800, image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Memory+Card+64GB' },
    { id: 10, name: 'Memory Card 32 GB',            price: 1200, image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Memory+Card+32GB' },
    { id: 11, name: 'Memory Card 16 GB',            price: 700,  image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Memory+Card+16GB' },
    { id: 12, name: 'Memory Card 8 GB',             price: 450,  image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Memory+Card+8GB' },
    { id: 13, name: 'Flash Disk 64 GB',             price: 700,  image: 'https://i.pinimg.com/1200x/14/e8/f4/14e8f43c3054bcdd29686cc992f700f2.jpg' },
    { id: 14, name: 'Flash Disk 32 GB',             price: 500,  image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Flash+Disk+32GB' },
    { id: 15, name: 'Flash Disk 16 GB',             price: 350,  image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Flash+Disk+16GB' },
    { id: 16, name: 'Flash Disk 8 GB',              price: 250,  image: 'https://placehold.co/400x300/1e3a5f/93c5fd?text=Flash+Disk+8GB' },
  ],
  SERVICES: [
    {
      icon: 'ph-wifi-high',
      title: 'Internet Access',
      description: 'High-speed browsing and secure cyber café environment.',
      color: 'blue',
      uploadLabel: null
    },
    {
      icon: 'ph-printer',
      title: 'Print & Scan',
      description: 'High-quality color/B&W printing, scanning, and photocopying.',
      color: 'purple',
      uploadLabel: 'Upload Document to Print',
      uploadHint: 'Accepts PDF, DOCX, JPEG, PNG — max 20 MB',
      acceptTypes: '.pdf,.doc,.docx,.jpg,.jpeg,.png'
    },
    {
      icon: 'ph-file-text',
      title: 'Typing & Resumes',
      description: 'Professional document typing, CV creation, and online job applications.',
      color: 'orange',
      uploadLabel: 'Upload Draft / Notes',
      uploadHint: 'Share your draft so we can refine it for you.',
      acceptTypes: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'
    },
    {
      icon: 'ph-money',
      title: 'M-PESA Services',
      description: 'Quick deposits, withdrawals, and bill payments agent.',
      color: 'green',
      uploadLabel: null
    }
  ]
};

Object.freeze(CONFIG);
