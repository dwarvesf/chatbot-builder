import os
import shutil
from typing import Union

import requests
from app.db.database import get_db
from app.models.models import *
from app.utils.image import generate_img_summaries
from app.utils.pdf import (categorize_elements, extract_pdf_elements,
                           generate_table_summaries)
from fastapi import Depends, FastAPI, HTTPException
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status


class SyncBotSourceRequest(BaseModel):
    botSourceId: str

app = FastAPI()

@app.post("/api/sync-bot-source")
def sync_bot_source(request: SyncBotSourceRequest, db: Session = Depends(get_db)):
  botsourceID = request.botSourceId
  botSource = db.query(BotSource).filter(BotSource.id == botsourceID).first()
  if botSource is None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Bot source not found")

  botSourceExtractedData = db.query(BotSourceExtractedData).filter(BotSourceExtractedData.bot_source_id == botsourceID).first()
  if botSourceExtractedData is None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Bot source extracted data not found")
  
  try:
    response = requests.get(botSource.url, stream=True)
    response.raise_for_status()
  except requests.exceptions.HTTPError as error:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"internal server error")
    
  current_directory = os.getcwd()
  final_directory = os.path.join(current_directory, str(botsourceID))
  if os.path.exists(final_directory):
    shutil.rmtree(final_directory)
  os.makedirs(final_directory) 

  filePath=os.path.join(final_directory, botSource.name)
  pdf = open(filePath, 'wb')
  pdf.write(response.content)
  pdf.close()

  raw_pdf_elements = extract_pdf_elements(final_directory+'/', botSource.name)

  # Categorize elements by type
  texts,tables=categorize_elements(raw_pdf_elements)

  joined_texts = " ".join(texts)
  
  text_splitter=RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separators=[
      ' ',
      '\n',
      '\n\n',
      ',',
      '.',
      '\u2022',
      '\u200b',
      '\uff0c', 
      '\u3001', 
      '\uff0e',
      '\u3002'
    ],
  )
  text_chunks=text_splitter.create_documents([joined_texts])
  embeddings = OpenAIEmbeddings(
    model='text-embedding-3-small',
    dimensions=1024,
  )
  embeddings_text_output = embeddings.embed_documents([text.page_content for text in text_chunks])

  for i, embedding in enumerate(embeddings_text_output):
    db.add(BotSourceExtractedDataVector(
      bot_source_extracted_data_id=botSourceExtractedData.id,
      content=text_chunks[i].page_content,
      vector=embedding
    ))

  table_summaries=generate_table_summaries(tables)

  embeddings_table_output = embeddings.embed_documents(table_summaries)

  for i, embedding in enumerate(embeddings_table_output):
    db.add(BotSourceExtractedDataVector(
      bot_source_extracted_data_id=botSourceExtractedData.id,
      content=tables[i],
      vector=embedding
    ))

  # images
  base64_img,img_summaries=generate_img_summaries(final_directory)
  
  embeddings_image_output = embeddings.embed_documents(img_summaries)

  for i, embedding in enumerate(embeddings_image_output):
    db.add(BotSourceExtractedDataVector(
      bot_source_extracted_data_id=botSourceExtractedData.id,
      content=base64_img[i],
      vector=embedding
    ))
  
  shutil.rmtree(final_directory)
  
  try:
    db.commit()
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"internal server error")

  return {"message": "ok"}

