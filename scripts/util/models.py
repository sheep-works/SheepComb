from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Union

class RawDocument(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    filename: str
    contents: Union[str, bytes]  # XML, Text (str) or Office (bytes) contents
    metadata: Dict[str, Any] = {}
