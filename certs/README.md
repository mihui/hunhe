# Command to generate the certificates

## Generate JWT private & public keys

### 1. Generate private key

```sh
ssh-keygen -t rsa -b 4096 -m PEM -f jwt_private.key
```

* Note: the algrithem will be "PS256"

### 2. Generate public key

```sh
openssl rsa -in jwt_private.key -pubout -outform PEM -out jwt_private.key.pub
```

---

## Generate SSL certificates

```sh
openssl genrsa -out ssl_key.pem 2048
```

## Generate the required Certificate Requests

```sh
openssl req -new -key ssl_key.pem -subj "/C=CN/ST=Liaoning/L=Dalian/O=Hunhe Studio/CN=localhost/" -out ssl_key.csr -config ssl_key.conf
```

## Use the Certificate Requests to sign the SSL Certificates

```sh
sudo openssl x509 -req -extensions v3_req -days 3650 -in ssl_key.csr -signkey ssl_key.pem -out ssl_cert.pem -extfile ssl_key.conf
```
