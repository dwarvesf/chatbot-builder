FROM python:3.12

WORKDIR /preprocessor

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 poppler-utils tesseract-ocr -y

COPY ./requirements.txt /preprocessor/requirements.txt

RUN pip install --no-cache-dir -r /preprocessor/requirements.txt

COPY . /preprocessor/

EXPOSE 80

CMD ["fastapi", "run", "main.py", "--port", "80"]