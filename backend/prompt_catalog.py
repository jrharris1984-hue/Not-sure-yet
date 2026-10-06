"""Validation for user-authored prompt library data (never executable code)."""
import json
import re

def validate_prompt_catalog(value):
    if not isinstance(value, dict) or not isinstance(value.get('sections'), list):
        raise ValueError('Prompt library must contain a list of categories.')
    if len(json.dumps(value)) > 500_000 or len(value['sections']) > 60:
        raise ValueError('Prompt library is too large.')
    def text(item, key, maximum, empty=False):
        v = item.get(key, '')
        if not isinstance(v, str) or len(v) > maximum or (not empty and not v.strip()):
            raise ValueError(f'Enter valid {key} text (maximum {maximum} characters).')
        return v.strip()
    def key(item):
        v = text(item, 'key', 64)
        if not re.fullmatch('[a-z][a-z0-9_]*', v) or v in {'__proto__', 'constructor', 'prototype'}:
            raise ValueError('Invalid category or subcategory identifier.')
        return v
    sections=[]; section_keys=set()
    for section in value['sections']:
        if not isinstance(section, dict): raise ValueError('Invalid category.')
        sid=key(section)
        if sid in section_keys: raise ValueError('Duplicate category.')
        section_keys.add(sid)
        fields=section.get('fields')
        if not isinstance(fields,list) or len(fields)>80: raise ValueError('Invalid subcategories.')
        clean_fields=[]; field_keys=set()
        for field in fields:
            if not isinstance(field,dict): raise ValueError('Invalid subcategory.')
            fid=key(field)
            if fid in field_keys: raise ValueError('Duplicate subcategory.')
            field_keys.add(fid)
            kind=field.get('type','chips')
            if kind not in {'chips','chips_multi','pose_chips','slider','text'}: raise ValueError('Invalid control type.')
            options=field.get('options',[])
            if not isinstance(options,list) or len(options)>300: raise ValueError('Too many choices in a subcategory.')
            clean_options=[]; option_keys=set()
            for option in options:
                if not isinstance(option,dict): raise ValueError('Invalid choice.')
                oid=text(option,'value',200)
                if oid in option_keys: raise ValueError('Duplicate choice.')
                option_keys.add(oid)
                clean_options.append({'value':oid,'label':text(option,'label',200),'keywords':text(option,'keywords',1500,True),'group':text(option,'group',200,True)})
                for compact_key in ('short', 'short_tags'):
                    if compact_key in option:
                        clean_options[-1][compact_key] = text(option,compact_key,500,True)
            clean_fields.append({'key':fid,'label':text(field,'label',200),'type':kind,'options':clean_options})
        sections.append({'key':sid,'title':text(section,'title',200),'fields':clean_fields})
    rules=value.get('rules',[])
    if not isinstance(rules,list) or len(rules)>100: raise ValueError('Too many prompt rules.')
    clean_rules=[]; rule_keys=set()
    for rule in rules:
        if not isinstance(rule,dict): raise ValueError('Invalid prompt rule.')
        rid=key(rule)
        if rid in rule_keys: raise ValueError('Duplicate prompt rule.')
        rule_keys.add(rid)
        kind=rule.get('kind','positive'); scope=rule.get('scope','all'); enabled=rule.get('enabled',True)
        if kind not in {'positive','negative'} or scope not in {'all','image','edit','video','text_video'} or not isinstance(enabled,bool):
            raise ValueError('Invalid prompt rule setting.')
        clean_rules.append({'key':rid,'label':text(rule,'label',200),'text':text(rule,'text',1500),'kind':kind,'scope':scope,'enabled':enabled})
    return {'sections':sections, **({'rules':clean_rules} if 'rules' in value else {})}
