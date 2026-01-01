$filePath = "C:\Users\Asus\Documents\freaks-ai-summarizer\src\pages\KnowledgeLab.jsx"
$content = Get-Content $filePath -Raw

# Fix the malformed closing structure
$oldPattern = @"
      </div>,
    document.body
  )
}
    </div >
  );
};
"@

$newPattern = @"
      </div>,
      document.body
    )}
    </div>
  );
};
"@

$content = $content.Replace($oldPattern, $newPattern)
Set-Content $filePath -Value $content -NoNewline
Write-Host "Fixed the JSX closing structure!"
