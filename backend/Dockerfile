FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Créer le répertoire pour les uploads s'il n'existe pas
RUN mkdir -p uploads

# Exposer le port sur lequel l'application Flask s'exécute
EXPOSE 5000

# Commande pour démarrer l'application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
