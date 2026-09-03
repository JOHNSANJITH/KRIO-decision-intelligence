from pydantic import BaseModel, Field


class ScenarioRequest(BaseModel):
    changes: list[float] | None = None
    planning_months: int = Field(default=6, ge=1, le=18)


class OptimizationRequest(BaseModel):
    min_runway_months: float = Field(default=6.0, ge=0, le=18)
    planning_months: int = Field(default=6, ge=1, le=18)
    min_change: float = Field(default=-0.3, ge=-0.9, le=0.0)
    max_change: float = Field(default=0.3, ge=0.0, le=3.0)
