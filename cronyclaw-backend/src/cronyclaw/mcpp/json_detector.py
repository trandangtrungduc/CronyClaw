import json
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger


class StreamJSONDetector:
    """Detector for real-time JSON detection in streaming text."""

    def __init__(self):
        self.buffer = ""
        self.potential_jsons = []
        self.completed_jsons = []
        self.processed_ranges = []

    def process_chunk(self, chunk: str) -> List[Dict[str, Any]]:
        """Process a single text chunk, return a list of complete JSON objects found in this chunk.

        Args:
            chunk (str): Received text chunk

        Returns:
            List[Dict[str, Any]]: List of complete JSON objects parsed from the current chunk
        """
        old_length = len(self.buffer)
        self.buffer += chunk
        self._find_potential_starts(old_length)
        new_jsons = self._try_parse_jsons()

        return new_jsons

    def _find_potential_starts(self, start_from: int) -> None:
        """Find new potential JSON starting positions in the buffer.

        Args:
            start_from (int): Position to start searching from
        """
        for i in range(start_from, len(self.buffer)):
            if self.buffer[i] == "{" and not self._is_in_processed_range(i):
                self.potential_jsons.append(i)

    def _is_in_processed_range(self, pos: int) -> bool:
        """Check if a specified position is within a processed range.

        Args:
            pos (int): Position to check

        Returns:
            bool: True if position is within a processed range, otherwise False
        """
        for start, end in self.processed_ranges:
            if start <= pos <= end:
                return True
        return False

    def _try_parse_jsons(self) -> List[Dict[str, Any]]:
        """Try to parse JSON objects from the current buffer.

        Returns:
            List[Dict[str, Any]]: List of newly parsed JSON objects
        """
        new_jsons = []
        remaining_potential = []

        self.potential_jsons.sort()

        for start_idx in self.potential_jsons:
            if self._is_in_processed_range(start_idx):
                continue

            result, end_idx = self._extract_json(start_idx)
            if result is not None:
                new_jsons.append(result)
                self.processed_ranges.append((start_idx, end_idx))
                self.completed_jsons.append(result)
            else:
                remaining_potential.append(start_idx)

        self.potential_jsons = remaining_potential
        return new_jsons

    def _extract_json(self, start_idx: int) -> Tuple[Optional[Dict[str, Any]], int]:
        """Try to extract a complete JSON object from the given position.

        Args:
            start_idx (int): Potential starting position of JSON

        Returns:
            Tuple[Optional[Dict[str, Any]], int]: Parsed JSON object and ending position,
                                               or (None, -1) if incomplete
        """
        stack = 1
        i = start_idx + 1

        while i < len(self.buffer) and stack > 0:
            if self.buffer[i] == "{":
                stack += 1
            elif self.buffer[i] == "}":
                stack -= 1
            i += 1

        if stack == 0:
            json_str = self.buffer[start_idx:i]
            try:
                json_data = json.loads(json_str)
                return json_data, i - 1
            except json.JSONDecodeError:
                logger.warning(
                    f"JSON structure found but parsing failed: {json_str[:50]}..."
                )

        return None, -1

    def get_all_jsons(self) -> List[Dict[str, Any]]:
        """Get all JSON objects parsed so far.

        Returns:
            List[Dict[str, Any]]: List of all parsed JSON objects
        """
        return self.completed_jsons

    def reset(self) -> None:
        """Reset detector state, prepare to process a new stream."""
        self.buffer = ""
        self.potential_jsons = []
        self.completed_jsons = []
        self.processed_ranges = []


# Usage example
if __name__ == "__main__":
    test_chunks = [
        "This is some plain text ",
        "Here comes JSON: {",
        '"name": "test", "values": [1, 2, ',
        '3]} This is text after JSON {"another": "json", ',
        '"nested": {"key": "value"}}',
    ]

    detector = StreamJSONDetector()

    for i, chunk in enumerate(test_chunks):
        logger.info(f"Processing chunk {i + 1}: {chunk}")
        new_jsons = detector.process_chunk(chunk)
        if new_jsons:
            logger.info(f"Complete JSON found in this chunk: {new_jsons}")

    logger.info(f"All detected JSONs: {detector.get_all_jsons()}")
