const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// Endpoint za obradu POST zahteva sa kontakt forme
app.post('/api/contact', async (req, res) => {
  const data = req.body; // Podaci sa kontakt forme

  // Konfiguracija Nodemailer transporter-a
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_ID,
      pass: process.env.USER_PASSWORD,
    },
  });

  const htmlBody = `
  <html>
    <body>
      <p>Ime: ${data.name}</p>
      <p>Prezime: ${data.last_name}</p>
      <p>E-mail: ${data.email}</p>
      <p>Telefon: ${data.phone}</p>
      <p>Subscription: ${data.subscribe === 'allowExtraEmails' ? 'Zelim da se pretplatim' : 'ne zelim da se pretplatim'}</p>
      <p style="font-weigth: bold">Prostorije:</p>
      <ul> ${data.room.map(room =>
      `<li key=${room}>${room}</li>`
      ).join('')}
      </ul>
      <p>Poruka: ${data.message}</p>
      <table>
        <thead>
          <tr>
            <th colspan="2">Slike u prilogu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
          ${data.image.map((image, index) => `
            <td>
              <img width="100" src="cid:image${index + 1}" alt="Slika ${index + 1}" />
            </td>
          `).join('')}
          </tr>
        </tbody>
      </table>
    </body>
  </html>
`;

  const userMailOptions = {
    from: process.env.USER_ID, // Pošiljalac e-maila
    to: data.email, // E-mail adresa korisnika
    subject: 'Hvala vam sto ste nas kontaktirali', // Naslov e-maila
    text: 'Hvala vam. Vaša poruka je primljena i odgovorićemo vam uskoro.', // Tekst e-maila
    html: htmlBody,
    attachments: data.image.map((image, index) => ({
      filename: `slika_${index + 1}`,
      content: image.split(';base64,').pop(),
      encoding: 'base64',
      cid: `image${index + 1}`,
    })),
  };

  // Konfiguracija e-maila
  const mailOptions = {
    from: data.email, // Pošiljalac e-maila
    to: 'info@keramicar-lale.online', // Primalac e-maila
    subject: `Nova Poruka od ${data.email}`, // Naslov e-maila
    replyTo: data.email,
    html: htmlBody,
    attachments: data.image.map((image, index) => ({
      filename: `slika_${index + 1}`,
      content: image.split(';base64,').pop(),
      encoding: 'base64',
      cid: `image${index + 1}`,
    })),
  };

  try {
    await transporter.sendMail(userMailOptions);
    console.log('E-mail korisniku poslat');
  } catch (error) {
    console.error('Greška prilikom slanja e-maila korisniku:', error);
    // Ovde možete dodati dodatnu logiku ili tretman greške ako je potrebno
  }

  // Slanje e-maila
  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail poslat');
    res.json({ message: 'Podaci su primljeni i obradjeni na serveru. E-mail je poslat.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Došlo je do greške prilikom slanja e-maila.' });
  }
});

// Pokretanje servera
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
