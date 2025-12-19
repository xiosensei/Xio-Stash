import requests
from bs4 import BeautifulSoup

# New Base URLs from your provided extractor info
BASE_URL = "https://www.sex.com"
API_URL = "https://www.sex.com/portal/api/gifs/search"
CDN_URL = "https://imagex1.sx.cdn.live"

session = requests.Session()

def get_galleries(query, aspect='both', limit=50, offset=0):
    imgs = []
    imgs.append({
        'name': 'search',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vector_search_icon.svg/330px-Vector_search_icon.svg.png',
        'url_hd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vector_search_icon.svg/330px-Vector_search_icon.svg.png',
        'set_url': query,
        'aspect_ratio': 300 / 300
    })
    
    if aspect != 'both':
        imgs = [img for img in imgs if filter_aspect_ratio(img, aspect)]
        
    return imgs

def get_set(set_url, aspect='both' , limit=50, offset=0):
    query = set_url
    params = {
        'search': query,
        'limit': limit,
        'page': (offset // limit) + 1,
        'order': 'likeCount',
        'sexual-orientation': 'straight'
    }
    
    try:
        response = session.get(API_URL, params=params)
        response.raise_for_status() # Check for HTTP errors
        data = response.json().get('data', [])
    except Exception as e:
        print(f"Error fetching galleries: {e}")
        return []

    imgs = []
    for i in data:
        path = i.get('uri', '')
        if not path: continue
        
        # Cleaner extension swapping
        final_path = path.replace('.webp', '.gif') if path.endswith('.webp') else path
        
        # Safe aspect ratio calculation
        height = int(i.get('height') or 300)
        
        imgs.append({
            'name': i.get('title', ''),
            'url': f"{CDN_URL.rstrip('/')}/{path.lstrip('/')}",
            'url_hd': f"{CDN_URL.rstrip('/')}/{final_path.lstrip('/')}",
            'set_url': query,
            'aspect_ratio': 300 / height
        })
        
    if aspect != 'both':
        imgs = [img for img in imgs if filter_aspect_ratio(img, aspect)]
    return {
        'description': i.get('title', ''),
        'images': imgs
    }
    
def filter_aspect_ratio(img, aspect='landscape'):
    if aspect == 'vertical':
        return img['aspect_ratio'] < 1
    else:
        return img['aspect_ratio'] > 1
