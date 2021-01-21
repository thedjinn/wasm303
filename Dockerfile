FROM rust:1.49.0-buster

RUN set -ex; \
    curl -sL https://deb.nodesource.com/setup_15.x | bash - && \
    apt-get install -y nodejs sudo binaryen wabt && \
    useradd -ms /bin/bash app -d /home/app -u 1000 -G sudo -p "$(openssl passwd -1 app)" && \
    mkdir -p /app && \
    chown app:app /app

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

USER app
WORKDIR /app

RUN rustup target add wasm32-unknown-unknown

RUN mkdir -p /home/app/.npm-packages/lib
RUN npm config set prefix /home/app/.npm-packages
RUN echo 'PATH="$NPM_PACKAGES/bin:$PATH"' >> ~/.bashrc
