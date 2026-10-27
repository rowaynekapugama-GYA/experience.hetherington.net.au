/*
  HETHERINGTON EXPERIENCE: preferences form settings
  ------------------------------------------------------------------
  Responses are emailed through SMTP2GO by the small function in
  api/submit.js. The SMTP2GO key and the inbox that receives responses
  are set in Vercel, not here. See SETUP.md.
*/
window.HX_CONFIG = {

  // Where the form posts its answers. Leave as is when deployed on Vercel.
  endpoint: "/api/submit",
  provider: "smtp2go",

  // Who manages the program day to day. Shown on the thank-you screen,
  // and used if a client ever needs to email their answers instead.
  contactName: "Lauren",
  contactEmail: "events@hemts.com.au",

  // David's photo and sign-off on the welcome letter
  hostName: "David Salim",
  hostTitle: "CEO & Principal Solicitor",
  hostPhoto: "https://hetherington.net.au/wp-content/uploads/2024/10/Team-Board-David-Salim-new.jpg"
};
