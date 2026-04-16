class Marky < Formula
  desc "Local-first markdown workspace for browsing and editing notes"
  homepage "https://github.com/romankarski/Marky"
  version "0.2.1"
  url "https://github.com/romankarski/Marky/releases/download/v0.2.1/marky-0.2.1.tgz"
  sha256 "724f697466cb1337b2f1d880d78e9da6c4a5d1aabc68f4bf3af8a8e403c05a3e"
  license "MIT"

  depends_on "node"

  def install
    cache_dir = buildpath/".npm-cache"

    system Formula["node"].opt_bin/"npm", "install", "--omit=dev", "--cache", cache_dir

    libexec.install Dir["*"]

    (bin/"marky").write <<~SH
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/server/dist/cli.js" "$@"
    SH
  end

  test do
    (testpath/"note.md").write("# hello from homebrew\n")
    output = shell_output("#{bin}/marky --no-open #{testpath} 2>&1", 1)
    assert_match "http://127.0.0.1:", output
  end
end
