class Marky < Formula
  desc "Local-first markdown workspace for browsing and editing notes"
  homepage "https://github.com/romankarski/Marky"
  version "0.1.2"
  url "https://github.com/romankarski/Marky/releases/download/v0.1.2/marky-0.1.2.tgz"
  sha256 "800dd919b237c2cd038875dc55f11838a1dcc394c478d379d14f05bfc761df33"
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
