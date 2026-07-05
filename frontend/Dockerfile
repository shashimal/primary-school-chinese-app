FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

# Generate a self-signed TLS certificate so the Vite dev server can serve
# HTTPS — required by Chrome and Safari to allow microphone access on LAN IPs.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /ssl \
    && openssl req -x509 -nodes -newkey rsa:2048 \
       -keyout /ssl/key.pem \
       -out    /ssl/cert.pem \
       -days   3650 \
       -subj   "/C=SG/O=Savean/CN=localhost"

COPY . .

EXPOSE 7001

CMD ["npm", "run", "dev", "--", "--host"]
