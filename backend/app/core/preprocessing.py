import re

def clean_text(text: str) -> str:
    """
    Normalizes whitespace and strips leading/trailing spaces.
    """
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def split_sentences(text: str) -> list[str]:
    """
    Splits text into sentences, protecting common abbreviations and initials to prevent over-splitting.
    """
    if not text:
        return []
    
    # Normalize duplicate spaces first but keep sentences separate
    text = re.sub(r'[ \t]+', ' ', text).strip()
    
    # List of common abbreviations to protect
    abbreviations = [
        r'Mr\.', r'Mrs\.', r'Ms\.', r'Dr\.', r'Prof\.', r'Sr\.', r'Jr\.', 
        r'U\.S\.', r'U\.K\.', r'e\.g\.', r'i\.e\.', r'a\.m\.', r'p\.m\.', r'vs\.', r'etc\.',
        r'Co\.', r'Corp\.', r'Inc\.', r'Ltd\.', r'Ph\.D\.', r'M\.D\.', r'Jan\.', r'Feb\.',
        r'Mar\.', r'Apr\.', r'Jun\.', r'Jul\.', r'Aug\.', r'Sep\.', r'Oct\.', r'Nov\.', r'Dec\.'
    ]
    
    temp_text = text
    placeholders = {}
    
    # 1. Protect single capital letter initials (e.g., "Marc T. Tarpenning" or "Steve J. Jobs")
    # We find patterns like " T. " or " J. " and replace with placeholder
    initials = re.findall(r'\b[A-Za-z]\.(?=\s)', temp_text)
    for i, init in enumerate(set(initials)):
        placeholder = f"__INITIAL_{i}__"
        placeholders[placeholder] = init
        # Replace only when it's a word boundary before and followed by space
        temp_text = temp_text.replace(init, placeholder)
        
    # 2. Protect multi-letter abbreviations
    for i, abbr_pattern in enumerate(abbreviations):
        # Find exact matches ignoring case
        matches = re.findall(r'\b' + abbr_pattern, temp_text, re.IGNORECASE)
        for j, match in enumerate(set(matches)):
            placeholder = f"__ABBR_{i}_{j}__"
            placeholders[placeholder] = match
            temp_text = temp_text.replace(match, placeholder)
            
    # 3. Split by sentence-ending punctuation (. ! ?) followed by whitespace or line break
    # Using lookbehind to split after the punctuation
    raw_sentences = re.split(r'(?<=[.!?])(?:\s+|\n+)', temp_text)
    
    # 4. Restore placeholders and clean up
    final_sentences = []
    for sent in raw_sentences:
        sent = sent.strip()
        if not sent:
            continue
        
        # Restore placeholders in reverse order to ensure accuracy
        for placeholder, original in placeholders.items():
            sent = sent.replace(placeholder, original)
            
        final_sentences.append(sent)
        
    return final_sentences
