FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY photos /usr/share/nginx/html/photos
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
