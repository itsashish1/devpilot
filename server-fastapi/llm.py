import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def query_llm(prompt: str, system_prompt: str = "You are a helpful assistant.", temperature: float = 0.2) -> str:
    """
    Routes queries to Anthropic Claude (via Aerolink Proxy) if ANTHROPIC_API_KEY is configured.
    Falls back to Gemini if GEMINI_API_KEY/GOOGLE_API_KEY is configured.
    Otherwise, throws an exception to trigger rule-based fallbacks.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    # 1. Try Anthropic Claude via Aerolink Proxy
    if anthropic_key:
        try:
            base_url = os.getenv("ANTHROPIC_API_BASE", "https://capi.aerolink.lat/v1")
            
            # Clean and format endpoint
            base_url_cleaned = base_url.rstrip("/")
            if not base_url_cleaned.endswith("/v1"):
                endpoint = f"{base_url_cleaned}/v1/messages"
            else:
                endpoint = f"{base_url_cleaned}/messages"
                
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
                "accept-encoding": "identity"
            }
            
            combined_prompt = f"[System Instructions]\n{system_prompt}\n\n[User Request]\n{prompt}"
            payload = {
                "model": "claude-sonnet-5",
                "max_tokens": 4000,
                "messages": [
                    {"role": "user", "content": combined_prompt}
                ]
            }
            
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            if response.status_code != 200:
                print(f"[LLM Router] Aerolink proxy returned code {response.status_code}: {response.text}")
            response.raise_for_status()
            res_data = response.json()
            return res_data["content"][0]["text"]
        except Exception as e:
            print(f"[LLM Router] Anthropic Claude via Aerolink failed: {e}")

    # 2. Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                temperature=temperature
            )
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ])
            return response.content
        except Exception as e:
            print(f"[LLM Router] Gemini request failed: {e}")

    raise RuntimeError("No LLM key matches or requests succeeded.")

def query_llm_chat(history: list, system_prompt: str = "You are a helpful assistant.", temperature: float = 0.5) -> str:
    """
    Routes chat conversation threads containing history to Anthropic Claude or Gemini.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    # 1. Try Anthropic Claude via Aerolink Proxy
    if anthropic_key:
        try:
            base_url = os.getenv("ANTHROPIC_API_BASE", "https://capi.aerolink.lat/v1")
            base_url_cleaned = base_url.rstrip("/")
            if not base_url_cleaned.endswith("/v1"):
                endpoint = f"{base_url_cleaned}/v1/messages"
            else:
                endpoint = f"{base_url_cleaned}/messages"
                
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
                "accept-encoding": "identity"
            }
            
            # Format messages for Claude
            formatted_messages = []
            for msg in history:
                formatted_messages.append({
                    "role": "assistant" if msg.get("role") in ["assistant", "system"] else "user",
                    "content": msg.get("content", "")
                })
                
            payload = {
                "model": "claude-sonnet-5",
                "system": system_prompt,
                "max_tokens": 4000,
                "messages": formatted_messages
            }
            
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            if response.status_code != 200:
                print(f"[LLM Router] Aerolink proxy chat returned code {response.status_code}: {response.text}")
            response.raise_for_status()
            res_data = response.json()
            return res_data["content"][0]["text"]
        except Exception as e:
            print(f"[LLM Router] Anthropic Claude Chat via Aerolink failed: {e}")

    # 2. Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
            
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                temperature=temperature
            )
            
            messages = [SystemMessage(content=system_prompt)]
            for msg in history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["assistant", "system"]:
                    messages.append(AIMessage(content=content))
                else:
                    messages.append(HumanMessage(content=content))
                    
            response = llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"[LLM Router] Gemini Chat request failed: {e}")

    raise RuntimeError("No LLM key matches or requests succeeded.")
