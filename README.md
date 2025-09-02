### Simple Grades

**Simple Grades** is a web application designed for personal use to track and manage academic grades and timetables. It provides a clean and intuitive interface to monitor progress and organize daily schedules efficiently.

#### Features

* **Grade Management:** Add, edit, and delete grades to calculate subject and overall averages.
* **Timetable Planner:** Create and manage your weekly class schedule.
* **Calendar:** Built-in calendar to keep track of your next exams.
* **Responsive Design:** Optimized for a seamless experience on both desktop and mobile devices.

#### Technologies

* **Frontend:** Next.js, React
* **Styling:** Tailwind CSS
* **Database:** PostgreSQL
* **Authentication:** NextAuth.js
* **ORM:** Prisma

---

### Getting Started

#### Requirements

* **Node.js** (version 18 or higher)
* **npm** (Node Package Manager)

### Or
* **Docker & Docker Compose** (for simplified setup)

#### Manual Setup

1.  Clone the repository:
    `git clone https://github.com/dhernos/Simple-Grades.git`

2.  Install dependencies:
    `npm install`

3.  Set up your environment variables in a `.env` file.

4.  Run the development server:
    `npm run dev`

Open `http://localhost:3000` in your browser.

#### Or use Docker Compose

```
version: '3.8'

services:
  nextjs-app:
    image: dhernos/simplegrades:latest
    container_name: grades_app
    environment:
      - DATABASE_URL=postgresql://postadmin:YOUR_POSTGRES_PASSWORD@db:5432/grades
      - NEXTAUTH_SECRET=BASE64_STRING
      - NEXTAUTH_URL=http://YOUR_DOMAIN/IP:3000
      - AUTH_TRUST_HOST=true
      - REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379
      #optional:
      - EMAIL_SERVER_HOST=
      - EMAIL_SERVER_PORT=
      - EMAIL_SERVER_SECURE=
      - EMAIL_SERVER_USER=
      - EMAIL_SERVER_PASSWORD=
      - EMAIL_FROM=
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    restart: always
    networks:
      - grades_network
    command: sh -c "npx prisma migrate deploy && npm start"

  db:
    image: postgres:13
    container_name: grades_postgres_db
    restart: always
    environment:
      - POSTGRES_USER=postadmin
      - POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
      - POSTGRES_DB=grades
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - grades_network
    healthcheck: # Healthcheck, um sicherzustellen, dass die DB bereit ist
      test: ["CMD-SHELL", "pg_isready -U postadmin"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    container_name: grades_redis
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --requirepass YOUR_REDIS_PASSWORD
    networks:
      - grades_network

volumes:
  postgres_data:
  redis_data:

networks:
  grades_network:
    driver: bridge
```

---

### Contributing

Contributions are welcome! If you find a bug or have a suggestion for a new feature, please open an issue or submit a pull request.

---

### License

This project is licensed under the MIT License.
