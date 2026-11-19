# Multi-stage / Production Dockerfile for Node.js Backend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# สร้างโฟลเดอร์สำหรับเก็บไฟล์อัปโหลด
RUN mkdir -p uploads

EXPOSE 5001

CMD ["npm", "start"]
