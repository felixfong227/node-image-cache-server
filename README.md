# NodeJS Image Caching Server

Cache the image with Redis at first load, after that will start serving the image from Redis cache

## Quick start with 🐬

```bash
$ docker-compose up
```

Done 🙈


# Routes

```
GET /{remote resources}
```

# Example

In this example, I am going to use one of the image from a website called [Unsplash](https://unsplash.com/)

[Image](https://unsplash.com/photos/9RSuy4ACHSA)

```
GET http://localhost:8080/https://images.unsplash.com/photo-1545303421-3f609fddb7af
```