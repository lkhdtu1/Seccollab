#!/usr/bin/env python3
"""
Script to convert PlantUML diagrams from markdown files to PNG images
"""

import os
import re
import subprocess
import tempfile
from pathlib import Path

def extract_plantuml_from_markdown(md_file_path):
    """Extract PlantUML code blocks from a markdown file"""
    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all PlantUML code blocks
    plantuml_blocks = []
    pattern = r'```plantuml\n(.*?)\n```'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        plantuml_blocks.append(match.strip())
    
    return plantuml_blocks

def convert_plantuml_to_png(plantuml_code, output_path, plantuml_jar_path):
    """Convert PlantUML code to PNG image"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.puml', delete=False) as temp_file:
        temp_file.write(plantuml_code)
        temp_file_path = temp_file.name
    
    try:
        # Run PlantUML to generate PNG
        cmd = [
            'java', '-jar', plantuml_jar_path,
            '-tpng',  # PNG format
            '-o', str(Path(output_path).parent),  # Output directory
            temp_file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            # Move generated PNG to desired location
            temp_png = temp_file_path.replace('.puml', '.png')
            if os.path.exists(temp_png):
                os.rename(temp_png, output_path)
                print(f"✓ Generated: {output_path}")
                return True
            else:
                print(f"✗ Failed to generate PNG for {output_path}")
                return False
        else:
            print(f"✗ PlantUML error: {result.stderr}")
            return False
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

def main():
    # Paths
    project_root = Path(__file__).parent.parent
    uml_docs_dir = project_root / 'docs' / 'uml'
    images_dir = uml_docs_dir / 'images'
    plantuml_jar = project_root / 'tools' / 'plantuml.jar'
    
    # Ensure images directory exists
    images_dir.mkdir(exist_ok=True)
    
    # UML files to convert
    uml_files = [
        ('1_class_diagram.md', '1_class_diagram.png'),
        ('2_use_case_diagram.md', '2_use_case_diagram.png'),
        ('3_sequence_diagrams.md', '3_sequence_diagrams.png'),
        ('4_component_diagram.md', '4_component_diagram.png'),
        ('5_activity_diagrams.md', '5_activity_diagrams.png'),
        ('6_entity_relationship_diagram.md', '6_entity_relationship_diagram.png'),
    ]
    
    print("Converting UML diagrams to PNG images...")
    print("=" * 50)
    
    for md_file, png_file in uml_files:
        md_path = uml_docs_dir / md_file
        png_path = images_dir / png_file
        
        if not md_path.exists():
            print(f"✗ Missing: {md_file}")
            continue
        
        print(f"\nProcessing: {md_file}")
        
        # Extract PlantUML blocks
        plantuml_blocks = extract_plantuml_from_markdown(md_path)
        
        if not plantuml_blocks:
            print(f"  ⚠ No PlantUML blocks found in {md_file}")
            continue
        
        # For files with multiple diagrams, combine them or use the main one
        if len(plantuml_blocks) == 1:
            # Single diagram
            success = convert_plantuml_to_png(
                plantuml_blocks[0], 
                png_path, 
                plantuml_jar
            )
        else:
            # Multiple diagrams - create separate files or combine
            print(f"  Found {len(plantuml_blocks)} diagrams")
            for i, block in enumerate(plantuml_blocks):
                if i == 0:
                    # Main diagram
                    success = convert_plantuml_to_png(block, png_path, plantuml_jar)
                else:
                    # Additional diagrams
                    additional_png = png_path.with_stem(f"{png_path.stem}_{i+1}")
                    convert_plantuml_to_png(block, additional_png, plantuml_jar)
    
    print("\n" + "=" * 50)
    print("UML to PNG conversion completed!")

if __name__ == "__main__":
    main()
