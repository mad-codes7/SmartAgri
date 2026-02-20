"""
SmartAgri AI - Community Router
District-scoped farmer posts, comments, and upvotes.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from database import get_db
from db_models import CommunityPost, CommunityComment, CommunityUpvote, User
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/community", tags=["Community"])

VALID_CATEGORIES = {"tip", "price", "pest", "question", "general"}


# ── Pydantic schemas ──────────────────────────────────────

class PostCreate(BaseModel):
    content: str = Field(..., min_length=5, max_length=1000)
    category: str = Field(default="general")
    photo_url: Optional[str] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


def _post_to_dict(post: CommunityPost, upvoted_by_me: bool = False) -> dict:
    return {
        "id": post.id,
        "user_id": post.user_id,
        "user_name": post.user_name,
        "district": post.district,
        "state": post.state,
        "category": post.category,
        "content": post.content,
        "photo_url": post.photo_url,
        "upvote_count": post.upvote_count,
        "comment_count": post.comment_count,
        "upvoted_by_me": upvoted_by_me,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


def _comment_to_dict(c: CommunityComment) -> dict:
    return {
        "id": c.id,
        "post_id": c.post_id,
        "user_id": c.user_id,
        "user_name": c.user_name,
        "content": c.content,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


# ── Endpoints ─────────────────────────────────────────────

@router.get("/posts")
async def list_posts(
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    nearby: bool = Query(False, description="If true, return posts from ALL districts in the same state"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """List community posts, filtered by district/category. Paginated."""
    offset = (page - 1) * limit

    stmt = select(CommunityPost).order_by(CommunityPost.created_at.desc())

    if nearby and state:
        stmt = stmt.where(CommunityPost.state == state)
    elif district:
        stmt = stmt.where(CommunityPost.district == district)

    if category and category in VALID_CATEGORIES:
        stmt = stmt.where(CommunityPost.category == category)

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    posts = result.scalars().all()

    # Check which posts I already upvoted
    if posts:
        post_ids = [p.id for p in posts]
        up_stmt = select(CommunityUpvote.post_id).where(
            CommunityUpvote.post_id.in_(post_ids),
            CommunityUpvote.user_id == user_id,
        )
        up_result = await db.execute(up_stmt)
        my_upvotes = set(up_result.scalars().all())
    else:
        my_upvotes = set()

    return {
        "posts": [_post_to_dict(p, p.id in my_upvotes) for p in posts],
        "page": page,
        "limit": limit,
    }


@router.post("/posts", status_code=201)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Create a new community post. Uses user's district from their profile."""
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of: {', '.join(VALID_CATEGORIES)}")

    # Fetch user profile for name + district
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.district or not user.state:
        raise HTTPException(status_code=400, detail="Please set your district in Profile before posting.")

    post = CommunityPost(
        user_id=user_id,
        user_name=user.name,
        district=user.district,
        state=user.state,
        category=body.category,
        content=body.content,
        photo_url=body.photo_url,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return _post_to_dict(post)


@router.post("/posts/{post_id}/upvote")
async def toggle_upvote(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Toggle upvote on a post. Returns new upvote count and whether now upvoted."""
    post_stmt = select(CommunityPost).where(CommunityPost.id == post_id)
    post_result = await db.execute(post_stmt)
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    up_stmt = select(CommunityUpvote).where(
        CommunityUpvote.post_id == post_id,
        CommunityUpvote.user_id == user_id,
    )
    up_result = await db.execute(up_stmt)
    existing = up_result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        post.upvote_count = max(0, post.upvote_count - 1)
        upvoted = False
    else:
        db.add(CommunityUpvote(post_id=post_id, user_id=user_id))
        post.upvote_count += 1
        upvoted = True

    await db.commit()
    return {"upvoted": upvoted, "upvote_count": post.upvote_count}


@router.get("/posts/{post_id}/comments")
async def get_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """List all comments on a post."""
    stmt = select(CommunityComment).where(
        CommunityComment.post_id == post_id
    ).order_by(CommunityComment.created_at.asc())
    result = await db.execute(stmt)
    comments = result.scalars().all()
    return {"comments": [_comment_to_dict(c) for c in comments], "total": len(comments)}


@router.post("/posts/{post_id}/comments", status_code=201)
async def add_comment(
    post_id: int,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Add a comment to a post."""
    post_stmt = select(CommunityPost).where(CommunityPost.id == post_id)
    post_result = await db.execute(post_stmt)
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    comment = CommunityComment(
        post_id=post_id,
        user_id=user_id,
        user_name=user.name if user else "Farmer",
        content=body.content,
    )
    db.add(comment)
    post.comment_count += 1
    await db.commit()
    await db.refresh(comment)
    return _comment_to_dict(comment)


@router.get("/my-posts")
async def my_posts(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get posts created by the current user."""
    stmt = select(CommunityPost).where(
        CommunityPost.user_id == user_id
    ).order_by(CommunityPost.created_at.desc())
    result = await db.execute(stmt)
    posts = result.scalars().all()
    return {"posts": [_post_to_dict(p, False) for p in posts], "total": len(posts)}
