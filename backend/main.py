from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup

from analyzer import analyze_article
from ai_optimizer import ai_analyze
from optimizer import optimize_article

app = FastAPI(title="SEO Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ArticleData(BaseModel):
    h1: str = ""
    seo_title: str = ""
    meta_desc: str = ""
    content: str = ""
    main_keyword: str = ""
    secondary_keywords: str = ""


class AIAnalyzeRequest(BaseModel):
    article: ArticleData
    api_key: str = ""


class OptimizeRequest(BaseModel):
    article: ArticleData
    competitor_urls: list[str] = []
    api_key: str = ""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(data: ArticleData):
    return analyze_article(data.model_dump())


@app.post("/ai-analyze")
def ai_analyze_endpoint(req: AIAnalyzeRequest):
    data_dict = req.article.model_dump()
    soup = BeautifulSoup(data_dict["content"], "html.parser")
    data_dict["content_text"] = soup.get_text(separator=" ", strip=True)

    rule_results = analyze_article(data_dict)
    ai_results = ai_analyze(data_dict, rule_results["results"], api_key=req.api_key)

    if "error" in ai_results:
        raise HTTPException(status_code=400, detail=ai_results["error"])

    return {**rule_results, "ai": ai_results}


@app.post("/optimize")
def optimize_endpoint(req: OptimizeRequest):
    data_dict = req.article.model_dump()
    soup = BeautifulSoup(data_dict["content"], "html.parser")
    data_dict["content_text"] = soup.get_text(separator=" ", strip=True)

    if not req.competitor_urls:
        raise HTTPException(status_code=400, detail="Cần ít nhất 1 URL đối thủ")

    result = optimize_article(data_dict, req.competitor_urls, api_key=req.api_key)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
