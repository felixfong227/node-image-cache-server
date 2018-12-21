const http = require('http');
const https = require('https');
const sharp = require('sharp');
const redis = require('redis');
const client = redis.createClient({
    host: 'redis'
});

const server = http.createServer((req, res) => {
    
    const imageUrlPath = req.url.substr(1, req.url.length);
    
    // Look for the Redis cache
    
    client.get(imageUrlPath, (error, data) => {
        if(error) {
            console.log('Error during the fetching of image cache from Redis ', error);
            return res.end('Error');
        }
        
        if(data) {
            console.log('[Serving Image] From Cache');
            // If there is a cache matching the remote resource, serve the cache to the client
            res.statusCode = 200;
            res.setHeader('X-Is-Cached', 'TRUE');
            const binary = Buffer.from(data, 'hex');
            sharp(binary).pipe(res);
        } else {
            
            console.log('[Serving Image] From Network');
            // If there is not cache
    
            // Grab the image from the remote address
            
            try {
                
                https.get(imageUrlPath, imageStream => {
                    let binary = [];
                    
                    imageStream.once('readable', () => {
                        if(imageStream.statusCode !== 200 && imageStream.statusCode !== 304) {
                            console.log(imageUrlPath, res.statusCode);
                            res.statusCode = 500;
                            return res.end('Error');
                        }
                    });
                    
                    imageStream
                        .pipe(
                            sharp()
                            .on('data', chunk => {
                                binary.push(chunk)
                            })
                            .on('error', error => {
                                res.statusCode = 500;
                                res.end(error.message);
                            })
                        )
                        .pipe(res)
                        .once('finish', () => {
                            // Once finish, serve the client back to the client
                            res.end(null);
                            const buffer = Buffer.concat(binary);
                            const bufferHex = buffer.toString('hex');
                            // Once served, cache the binary to Redis based on the remote URL for later use cases
                            console.log('Caching ' + imageUrlPath);
                            client.setex(imageUrlPath, 3600, bufferHex, (error) => {
                                if(error) {
                                    return console.log('Error during the caching of image ', error);
                                }
                                console.log('Cached ' + imageUrlPath);
                            });
                        });
                    
                    imageStream.once('error', () => {
                        console.log(imageUrlPath, res.statusCode);
                        res.statusCode = 500;
                        return res.end('Error');
                    });
                    
                });
            }
            catch(error) {
                if(error.name === 'TypeError [ERR_INVALID_URL]') {
                    res.statusCode = 400;
                    res.end('Incorrect URL');
                } else {
                    res.statusCode = 500;
                    res.end('Error');
                    console.error(error);
                }
            }
                    
        }
    });
    
});

// Register a new port inside the port table
const PORT = 80;
server.listen(PORT, () => {
    console.log(`Node Cache Http Server Is Running 🔥`);
});