#!/usr/bin/env python3
"""
检查 i18n 字典中的缺失键
"""

import json
import re
from pathlib import Path

def parse_ts_object(text):
    """简单解析TS对象字面量为Python字典"""
    # 移除注释
    text = re.sub(r'//.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    
    # 提取导出的对象字面量部分
    match = re.search(r'export\s+const\s+[a-zA-Z0-9_]+\s*=\s*({.*?})\s*;', text, flags=re.DOTALL)
    if not match:
        print("无法找到导出的对象")
        return {}
    
    obj_str = match.group(1)
    
    # 将单引号替换为双引号
    obj_str = obj_str.replace("'", '"')
    
    # 替换末尾逗号
    obj_str = re.sub(r',(\s*[}\]])', r'\1', obj_str)
    
    # 将未加引号的键加上引号
    obj_str = re.sub(r'([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)', r'\1"\2"\3', obj_str)
    
    try:
        return json.loads(obj_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        print("解析的文本:")
        print(obj_str[:500] + ("..." if len(obj_str) > 500 else ""))
        return {}

def flatten_dict(d, parent_key='', sep='.'):
    """将嵌套字典扁平化"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def compare_dicts(dict1, dict2, name1, name2):
    """比较两个字典，找出缺失的键"""
    flat_dict1 = set(flatten_dict(dict1).keys())
    flat_dict2 = set(flatten_dict(dict2).keys())
    
    missing_in_dict2 = flat_dict1 - flat_dict2
    missing_in_dict1 = flat_dict2 - flat_dict1
    
    if missing_in_dict2:
        print(f"\n{name2} 中缺失的键 ({len(missing_in_dict2)} 个):")
        for key in sorted(missing_in_dict2):
            print(f"  - {key}")
            
    if missing_in_dict1:
        print(f"\n{name1} 中缺失的键 ({len(missing_in_dict1)} 个):")
        for key in sorted(missing_in_dict1):
            print(f"  - {key}")
            
    if not missing_in_dict1 and not missing_in_dict2:
        print(f"\n{name1} 和 {name2} 之间的键是匹配的。")
        
    # 检查值是否为空或者只是键名本身
    flat_dict1_items = flatten_dict(dict1)
    flat_dict2_items = flatten_dict(dict2)
    
    empty_or_key_values_1 = {k: v for k, v in flat_dict1_items.items() if not v or v == k}
    empty_or_key_values_2 = {k: v for k, v in flat_dict2_items.items() if not v or v == k}
    
    if empty_or_key_values_1:
        print(f"\n{name1} 中为空或等于键名的值:")
        for k, v in empty_or_key_values_1.items():
            print(f"  - {k}: {repr(v)}")
            
    if empty_or_key_values_2:
        print(f"\n{name2} 中为空或等于键名的值:")
        for k, v in empty_or_key_values_2.items():
            print(f"  - {k}: {repr(v)}")

def main():
    # 读取中文词典
    zh_cn_path = Path("app/src/lib/i18n/locales/zh-CN.ts")
    en_us_path = Path("app/src/lib/i18n/locales/en-US.ts")
    
    if not zh_cn_path.exists():
        print(f"找不到文件: {zh_cn_path}")
        return
        
    if not en_us_path.exists():
        print(f"找不到文件: {en_us_path}")
        return
    
    zh_cn_content = zh_cn_path.read_text(encoding='utf-8')
    en_us_content = en_us_path.read_text(encoding='utf-8')
    
    zh_cn_dict = parse_ts_object(zh_cn_content)
    en_us_dict = parse_ts_object(en_us_content)
    
    if not zh_cn_dict:
        print("无法解析中文词典")
        return
        
    if not en_us_dict:
        print("无法解析英文词典")
        return
    
    print("检查中英文词典之间的键一致性...")
    compare_dicts(zh_cn_dict, en_us_dict, "中文词典", "英文词典")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
import re
import sys
from pathlib import Path

# Chinese character pattern
CN_PATTERN = re.compile(r'[\u4e00-\u9fff]+')

# Exclude patterns
EXCLUDE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.svelte-kit', 'data', 'crawler', 'openspec', '.specify'}
EXCLUDE_FILES = {'check_i18n.py', 'zh-CN.ts', 'README.md', 'AGENTS.md', 'PLAN.md'}
INCLUDE_EXTS = {'.ts', '.svelte', '.js', '.tsx', '.jsx'}

def should_check(path: Path) -> bool:
    if any(ex in path.parts for ex in EXCLUDE_DIRS):
        return False
    if path.name in EXCLUDE_FILES:
        return False
    return path.suffix in INCLUDE_EXTS

def check_file(path: Path):
    try:
        content = path.read_text(encoding='utf-8')
        lines = content.split('\n')
        findings = []
        
        for i, line in enumerate(lines, 1):
            # Skip comments
            if '//' in line or '/*' in line or '*/' in line:
                continue
            # Skip import statements
            if 'import' in line and 'from' in line:
                continue
            
            matches = CN_PATTERN.findall(line)
            if matches:
                findings.append((i, line.strip(), matches))
        
        return findings
    except Exception:
        return []

def main():
    root = Path('app/src')
    if not root.exists():
        print("app/src not found")
        sys.exit(1)
    
    total = 0
    for path in root.rglob('*'):
        if not path.is_file() or not should_check(path):
            continue
        
        findings = check_file(path)
        if findings:
            print(f"\n{path}:")
            for line_num, line, matches in findings:
                print(f"  L{line_num}: {line[:80]}")
                total += 1
    
    print(f"\n总计: {total} 处硬编码中文")
    return 0 if total == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
