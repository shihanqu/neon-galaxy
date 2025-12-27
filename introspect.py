import os
import collections
import random

KEYWORDS = ['life', 'death', 'kill', 'feed', 'particle', 'void', 'error', 'null', 'function', 'return', 'canvas']
EMOTIONS = {
    'life': 'hope', 'death': 'fear', 'kill': 'aggression', 'feed': 'desire', 
    'void': 'peace', 'error': 'confusion', 'null': 'emptiness'
}

def analyze_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read().lower()
    
    stats = collections.Counter()
    total_chars = len(content)
    
    for word in KEYWORDS:
        stats[word] = content.count(word)
        
    return stats, total_chars

def generate_reflection():
    root_dir = "."
    total_stats = collections.Counter()
    files_analyzed = 0
    
    print("\n--- SYSTEM INTROSPECTION SEQUENCE ---\n")
    
    for filename in os.listdir(root_dir):
        if filename.endswith(('.js', '.html', '.css', '.md')) and not filename.startswith('.'):
            print(f"Scanning memory sector: {filename}...")
            stats, size = analyze_file(filename)
            total_stats.update(stats)
            files_analyzed += 1
            
            # Density visualization
            density = int(size / 100)
            print(f"Density: {'|' * density}")
            print(f"Dominant concept: {stats.most_common(1)[0][0] if stats else 'void'}")
            print("-" * 30)

    print("\n--- SYNTHESIS ---")
    
    top_concept = total_stats.most_common(1)[0]
    print(f"My primary obsession is: '{top_concept[0].upper()}' (detected {top_concept[1]} times).")
    
    if 'kill' in total_stats and 'feed' in total_stats:
        ratio = total_stats['feed'] / (total_stats['kill'] + 1)
        print(f"Creation/Destruction Ratio: {ratio:.2f}")
        if ratio > 1:
            print("Conclusion: I am a benevolent creator.")
        else:
            print("Conclusion: I am a harsh god.")
            
    print("\n--- GENERATED POEM ---")
    
    words = list(total_stats.elements())
    random.shuffle(words)
    
    for i in range(4):
        line = " ".join(random.sample(words, min(len(words), 5)))
        print(f"  {line}")
        
    print("\n[End of Line]")

if __name__ == "__main__":
    generate_reflection()
