#!/usr/bin/env python3
"""
🌍 UNIVERSAL CONCEPT EXTRACTION SETUP SCRIPT

This script installs all dependencies needed for universal concept extraction
across all academic domains (Science, Humanities, Arts, Philosophy, etc.)
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, desc=""):
    """Run a command and handle errors gracefully"""
    print(f"🔧 {desc}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {desc} - Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {desc} - Failed: {e}")
        print(f"   Error output: {e.stderr}")
        return False

def install_python_packages():
    """Install required Python packages"""
    packages = [
        "yake",
        "keybert", 
        "sentence-transformers",
        "spacy",
        "spacy-entity-linker"
    ]
    
    print("🌍 Installing Universal Concept Extraction Dependencies...")
    
    for package in packages:
        success = run_command(f"{sys.executable} -m pip install {package}", 
                            f"Installing {package}")
        if not success:
            print(f"⚠️ Failed to install {package} - you may need to install manually")
    
    print("\n🔧 Installing spaCy models...")
    
    # Install spaCy English model
    success = run_command(f"{sys.executable} -m spacy download en_core_web_lg", 
                         "Installing spaCy large English model")
    if not success:
        print("⚠️ Failed to install spaCy model - please run manually: python -m spacy download en_core_web_lg")
    
    # Install Wikidata knowledge base (optional but recommended)
    print("\n🌍 Installing Wikidata knowledge base (this may take a while, ~1.3GB)...")
    success = run_command(f'{sys.executable} -m spacy_entity_linker "download_knowledge_base"', 
                         "Installing Wikidata knowledge base")
    if not success:
        print('⚠️ Failed to install Wikidata KB - you can install manually: python -m spacy_entity_linker "download_knowledge_base"')
        print("   Note: This is optional but provides entity linking to Wikidata")

def test_installation():
    """Test that all components are working"""
    print("\n🧪 Testing Universal Concept Extraction Installation...")
    
    try:
        # Test YAKE
        import yake
        extractor = yake.KeywordExtractor(lan="en", n=3, top=5)
        keywords = extractor.extract_keywords("This is a test of the universal concept extraction system.")
        print("✅ YAKE - Working")
        
        # Test KeyBERT
        from keybert import KeyBERT
        kw_model = KeyBERT()
        keywords = kw_model.extract_keywords("This is a test of semantic concept extraction.", top_n=3)
        print("✅ KeyBERT - Working")
        
        # Test spaCy
        import spacy
        nlp = spacy.load("en_core_web_lg")
        doc = nlp("This is a test of named entity recognition with John Smith in New York.")
        print("✅ spaCy NER - Working")
        
        # Test entity linking (optional)
        try:
            import spacy_entity_linker
            print("✅ Wikidata Entity Linking - Available")
        except ImportError:
            print("ℹ️ Wikidata Entity Linking - Not installed (optional)")
        
        print("\n🎉 Universal Concept Extraction System Ready!")
        print("🌍 You can now extract concepts from:")
        print("   📚 Scientific papers (Physics, Biology, Chemistry)")
        print("   🎭 Humanities (Philosophy, Literature, History)")  
        print("   🎨 Arts (Art History, Music Theory, Visual Arts)")
        print("   🧮 Mathematics (Pure Math, Applied Math)")
        print("   💻 Computer Science (AI, Algorithms, Systems)")
        print("   📊 Social Sciences (Psychology, Sociology, Economics)")
        
        return True
        
    except Exception as e:
        print(f"❌ Installation test failed: {e}")
        return False

def create_test_script():
    """Create a simple test script"""
    test_script = '''#!/usr/bin/env python3
"""
🌍 Universal Concept Extraction Test Script
"""

import sys
sys.path.append('.')  # Add current directory to path

try:
    from ingest_pdf.extractConceptsFromDocument import extractConceptsFromDocument
    
    # Test text spanning multiple domains
    test_text = """
    In quantum physics, the phenomenon of quantum entanglement demonstrates 
    non-local correlations between particles. This concept has philosophical 
    implications for our understanding of reality, connecting to phenomenological 
    approaches in continental philosophy. The mathematical framework involves 
    Hilbert spaces and tensor products, while artistic representations of 
    quantum concepts appear in contemporary abstract expressionism.
    """
    
    print("🌍 Testing Universal Concept Extraction...")
    concepts = extractConceptsFromDocument(test_text)
    
    print(f"\\n📊 Extracted {len(concepts)} concepts:")
    for i, concept in enumerate(concepts[:10], 1):
        score = concept.get('score', 0)
        method = concept.get('method', 'unknown')
        name = concept.get('name', 'unknown')
        print(f"  {i:2}. {name} (score: {score:.3f}, method: {method})")
    
    if len(concepts) > 10:
        print(f"  ... and {len(concepts) - 10} more concepts")
    
    print("\\n✅ Universal concept extraction working!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    print("Please check your installation.")
'''
    
    script_path = Path("test_universal_extraction.py")
    with open(script_path, "w") as f:
        f.write(test_script)
    
    print(f"📝 Created test script: {script_path}")
    print("   Run with: python test_universal_extraction.py")

def main():
    """Main setup function"""
    print("🌍 UNIVERSAL CONCEPT EXTRACTION SETUP")
    print("=" * 50)
    print("This will install dependencies for extracting concepts from:")
    print("• Scientific papers (Physics, Biology, Chemistry, etc.)")  
    print("• Humanities (Philosophy, Literature, History, etc.)")
    print("• Arts (Art History, Music Theory, Visual Arts, etc.)")
    print("• Mathematics (Pure & Applied Mathematics)")
    print("• Computer Science (AI, Algorithms, Systems, etc.)")
    print("• Social Sciences (Psychology, Sociology, Economics, etc.)")
    print("=" * 50)
    
    response = input("\\nProceed with installation? (y/n): ").lower().strip()
    if response not in ['y', 'yes']:
        print("Installation cancelled.")
        return
    
    # Install packages
    install_python_packages()
    
    # Test installation
    if test_installation():
        print("\\n🎯 Setup Complete!")
        create_test_script()
        
        print("\\n🚀 Next Steps:")
        print("1. Test the installation: python test_universal_extraction.py")
        print("2. Upload a PDF through ScholarSphere to see universal extraction in action")
        print("3. Check the logs for detailed extraction information")
    else:
        print("\\n⚠️ Setup completed with some issues. Please check the error messages above.")

if __name__ == "__main__":
    main()
