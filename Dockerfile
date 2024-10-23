From --platform=linux/amd64 nginx:alpine


COPY ./dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

